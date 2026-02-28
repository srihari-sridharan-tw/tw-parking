import { prisma } from "../../db/prisma.js";

export interface DailyReport {
  generatedAt: string;
  totalSlots: number;
  usedSlots: number;
  emptySlots: number;
  occupiedSlots: { slotId: string; vehicleNumber: string }[];
}

export async function getDailyReport(): Promise<DailyReport> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeCheckIns, totalSlots] = await Promise.all([
    prisma.checkIn.findMany({
      where: {
        checkedInAt: { gte: today },
        checkedOutAt: null,
      },
      include: { slot: true },
    }),
    prisma.parkingSlot.count({ where: { isActive: true } }),
  ]);

  const usedSlots = activeCheckIns.length;

  return {
    generatedAt: new Date().toISOString(),
    totalSlots,
    usedSlots,
    emptySlots: totalSlots - usedSlots,
    occupiedSlots: activeCheckIns.map((c) => ({
      slotId: c.slot.slotCode,
      vehicleNumber: c.vehicleId,
    })),
  };
}
