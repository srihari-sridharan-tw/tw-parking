import type { SlotFlag, ParkingSlot, User } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { notFound, badRequest } from "../../utils/errors.js";
import type { CreateFlagInput } from "./flags.schema.js";

type FlagWithDetails = SlotFlag & {
  slot: ParkingSlot;
  reportedBy: Pick<User, "id" | "email">;
  resolvedBy: Pick<User, "id" | "email"> | null;
};

export async function createFlag(
  reportedById: string,
  data: CreateFlagInput
): Promise<FlagWithDetails> {
  const slot = await prisma.parkingSlot.findUnique({
    where: { id: data.slotId },
  });
  if (!slot || !slot.isActive) throw notFound("Slot not found");

  const activeCheckIn = await prisma.checkIn.findFirst({
    where: { slotId: data.slotId, checkedOutAt: null },
  });
  if (activeCheckIn) {
    throw badRequest(
      "Slot has an active registered check-in. Use the daily report to identify unauthorised vehicles."
    );
  }

  return prisma.slotFlag.create({
    data: { slotId: data.slotId, vehicleId: data.vehicleId, reportedById },
    include: {
      slot: true,
      reportedBy: { select: { id: true, email: true } },
      resolvedBy: { select: { id: true, email: true } },
    },
  });
}

export async function listFlags(
  resolvedFilter?: "true" | "false"
): Promise<FlagWithDetails[]> {
  const where =
    resolvedFilter === "true"
      ? { resolvedAt: { not: null } }
      : resolvedFilter === "false"
        ? { resolvedAt: null }
        : {};

  return prisma.slotFlag.findMany({
    where,
    include: {
      slot: true,
      reportedBy: { select: { id: true, email: true } },
      resolvedBy: { select: { id: true, email: true } },
    },
    orderBy: { reportedAt: "desc" },
  });
}

export async function resolveFlag(
  flagId: string,
  resolvedById: string
): Promise<FlagWithDetails> {
  const flag = await prisma.slotFlag.findUnique({ where: { id: flagId } });
  if (!flag) throw notFound("Flag not found");
  if (flag.resolvedAt) throw badRequest("Flag is already resolved");

  return prisma.slotFlag.update({
    where: { id: flagId },
    data: { resolvedAt: new Date(), resolvedById },
    include: {
      slot: true,
      reportedBy: { select: { id: true, email: true } },
      resolvedBy: { select: { id: true, email: true } },
    },
  });
}
