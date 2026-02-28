import bcrypt from "bcrypt";
import type { CheckIn, ParkingSlot } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { notFound, conflict, badRequest, forbidden, unauthorized } from "../../utils/errors.js";

export async function getAvailableSlots(): Promise<ParkingSlot[]> {
  return prisma.parkingSlot.findMany({
    where: {
      isActive: true,
      checkIns: { none: { checkedOutAt: null } },
    },
    orderBy: [{ level: "asc" }, { slotCode: "asc" }],
  });
}

export async function checkIn(
  userId: string,
  slotId: string
): Promise<CheckIn & { slot: ParkingSlot }> {
  const slot = await prisma.parkingSlot.findUnique({ where: { id: slotId } });
  if (!slot || !slot.isActive) throw notFound("Slot not found");

  const slotOccupied = await prisma.checkIn.findFirst({
    where: { slotId, checkedOutAt: null },
  });
  if (slotOccupied) throw conflict("Slot is already occupied");

  const userCheckedIn = await prisma.checkIn.findFirst({
    where: { userId, checkedOutAt: null },
  });
  if (userCheckedIn) throw conflict("You are already checked in to another slot");

  const profile = await prisma.employeeProfile.findUnique({
    where: { userId },
  });
  if (!profile) throw badRequest("Employee profile not found");

  const checkInRecord = await prisma.checkIn.create({
    data: { slotId, userId, vehicleId: profile.vehicleId },
    include: { slot: true },
  });

  return checkInRecord;
}

export async function checkOut(
  userId: string,
  checkInId: string
): Promise<CheckIn & { slot: ParkingSlot }> {
  const checkInRecord = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    include: { slot: true },
  });

  if (!checkInRecord) throw notFound("Check-in record not found");
  if (checkInRecord.userId !== userId) throw forbidden("Not your check-in");
  if (checkInRecord.checkedOutAt) {
    throw badRequest("Already checked out");
  }

  return prisma.checkIn.update({
    where: { id: checkInId },
    data: { checkedOutAt: new Date() },
    include: { slot: true },
  });
}

export async function getMyCheckIns(
  userId: string
): Promise<(CheckIn & { slot: ParkingSlot })[]> {
  return prisma.checkIn.findMany({
    where: { userId },
    include: { slot: true },
    orderBy: { checkedInAt: "desc" },
  });
}

export async function forceCheckoutAll(
  adminUserId: string,
  password: string
): Promise<{ count: number }> {
  const admin = await prisma.user.findUnique({ where: { id: adminUserId } });
  if (!admin) throw unauthorized("User not found");
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw unauthorized("Incorrect password");

  const result = await prisma.checkIn.updateMany({
    where: { checkedOutAt: null },
    data: { checkedOutAt: new Date() },
  });
  return { count: result.count };
}
