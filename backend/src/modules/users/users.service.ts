import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { unauthorized } from "../../utils/errors.js";

export interface UserListItem {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
  profile: {
    employeeId: string;
    vehicleId: string;
    phoneNumber: string;
  } | null;
}

export async function listUsers(): Promise<UserListItem[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      profile: {
        select: {
          employeeId: true,
          vehicleId: true,
          phoneNumber: true,
        },
      },
    },
  });
  return users;
}

export async function clearEmployees(
  adminUserId: string,
  password: string
): Promise<{ count: number }> {
  const admin = await prisma.user.findUnique({ where: { id: adminUserId } });
  if (!admin) throw unauthorized("User not found");
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw unauthorized("Incorrect password");

  const employeeIds = await prisma.user
    .findMany({ where: { role: Role.EMPLOYEE }, select: { id: true } })
    .then((rows) => rows.map((r) => r.id));

  if (employeeIds.length === 0) return { count: 0 };

  await prisma.$transaction([
    // Delete flags reported by employees (reportedById is non-nullable)
    prisma.slotFlag.deleteMany({
      where: { reportedById: { in: employeeIds } },
    }),
    // Delete check-ins by employees
    prisma.checkIn.deleteMany({
      where: { userId: { in: employeeIds } },
    }),
    // Delete employee users (EmployeeProfile cascades automatically)
    prisma.user.deleteMany({
      where: { id: { in: employeeIds } },
    }),
  ]);

  return { count: employeeIds.length };
}
