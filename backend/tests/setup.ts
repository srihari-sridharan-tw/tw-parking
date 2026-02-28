import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export const prisma = new PrismaClient();

export async function cleanDatabase() {
  await prisma.passwordResetToken.deleteMany();
  await prisma.slotFlag.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.parkingSlot.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedTestData() {
  const adminHash = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.create({
    data: { email: "admin@test.com", passwordHash: adminHash, role: "ADMIN" },
  });

  const secHash = await bcrypt.hash("Security@1234", 12);
  const security = await prisma.user.create({
    data: {
      email: "security@test.com",
      passwordHash: secHash,
      role: "SECURITY",
    },
  });

  const empHash = await bcrypt.hash("Employee@1234", 12);
  const employee = await prisma.user.create({
    data: {
      email: "employee@test.com",
      passwordHash: empHash,
      role: "EMPLOYEE",
    },
  });
  await prisma.employeeProfile.create({
    data: {
      userId: employee.id,
      employeeId: "EMP001",
      vehicleId: "KA01AB1234",
      phoneNumber: "9876543210",
    },
  });

  const slot1 = await prisma.parkingSlot.create({
    data: { slotCode: "M1001", level: 1, type: "TWO_WHEELER" },
  });
  const slot2 = await prisma.parkingSlot.create({
    data: { slotCode: "C2001", level: 2, type: "FOUR_WHEELER" },
  });

  return { admin, security, employee, slot1, slot2 };
}
