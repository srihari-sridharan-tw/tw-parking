import type { ParkingSlot } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { notFound, conflict, badRequest } from "../../utils/errors.js";
import type { CreateSlotInput, UpdateSlotInput } from "./slots.schema.js";

export async function listSlots(): Promise<ParkingSlot[]> {
  return prisma.parkingSlot.findMany({
    where: { isActive: true },
    orderBy: [{ level: "asc" }, { slotCode: "asc" }],
  });
}

export async function createSlot(data: CreateSlotInput): Promise<ParkingSlot> {
  const existing = await prisma.parkingSlot.findUnique({
    where: { slotCode: data.slotCode },
  });

  if (existing) {
    if (existing.isActive) {
      throw conflict(`Slot code ${data.slotCode} already exists`);
    }
    // Slot was soft-deleted — reactivate it with the supplied values.
    return prisma.parkingSlot.update({
      where: { id: existing.id },
      data: { isActive: true, level: data.level, type: data.type },
    });
  }

  return prisma.parkingSlot.create({ data });
}

export async function updateSlot(
  id: string,
  data: UpdateSlotInput
): Promise<ParkingSlot> {
  const slot = await prisma.parkingSlot.findUnique({ where: { id } });
  if (!slot || !slot.isActive) throw notFound("Slot not found");

  if (data.slotCode && data.slotCode !== slot.slotCode) {
    const existing = await prisma.parkingSlot.findUnique({
      where: { slotCode: data.slotCode },
    });
    if (existing) throw conflict(`Slot code ${data.slotCode} already exists`);
  }

  return prisma.parkingSlot.update({ where: { id }, data });
}

export async function deleteSlot(id: string): Promise<void> {
  const slot = await prisma.parkingSlot.findUnique({ where: { id } });
  if (!slot || !slot.isActive) throw notFound("Slot not found");

  const activeCheckIn = await prisma.checkIn.findFirst({
    where: { slotId: id, checkedOutAt: null },
  });
  if (activeCheckIn) {
    throw badRequest("Cannot delete slot with an active check-in");
  }

  await prisma.parkingSlot.update({
    where: { id },
    data: { isActive: false },
  });
}
