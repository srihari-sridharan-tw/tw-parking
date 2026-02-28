import bcrypt from "bcrypt";
import crypto from "crypto";
import { Role } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../db/prisma.js";
import {
  unauthorized,
  conflict,
  badRequest,
  forbidden,
} from "../../utils/errors.js";
import type { LoginBody, RegisterBody } from "./auth.schema.js";

export async function loginUser(
  app: FastifyInstance,
  body: LoginBody,
  allowedRoles: Role[]
): Promise<{ token: string; role: Role; userId: string }> {
  const user = await prisma.user.findUnique({ where: { email: body.email } });

  if (!user) throw unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) throw unauthorized("Invalid email or password");

  if (!allowedRoles.includes(user.role)) {
    throw forbidden("This login endpoint is not available for your account type");
  }

  const token = app.jwt.sign({ userId: user.id, role: user.role });
  return { token, role: user.role, userId: user.id };
}

export async function registerEmployee(
  app: FastifyInstance,
  body: RegisterBody
): Promise<{ token: string; role: Role; userId: string }> {
  const existingEmail = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existingEmail) throw conflict("Email is already registered");

  const existingEmployeeId = await prisma.employeeProfile.findUnique({
    where: { employeeId: body.employeeId },
  });
  if (existingEmployeeId) throw conflict("Employee ID is already registered");

  const passwordHash = await bcrypt.hash(body.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { email: body.email, passwordHash, role: Role.EMPLOYEE },
    });
    await tx.employeeProfile.create({
      data: {
        userId: newUser.id,
        employeeId: body.employeeId,
        vehicleId: body.vehicleId,
        phoneNumber: body.phoneNumber,
      },
    });
    return newUser;
  });

  const token = app.jwt.sign({ userId: user.id, role: user.role });
  return { token, role: user.role, userId: user.id };
}

export async function forgotPassword(
  email: string,
  isDev: boolean
): Promise<{ message: string; resetToken?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) {
    return {
      message: "If that email exists, a reset link has been sent.",
    };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  if (!isDev) {
    // Production: send email via SMTP (not yet wired — log for now)
    console.log(`[PASSWORD RESET] token for ${email}: ${token}`);
  }

  return {
    message: "If that email exists, a reset link has been sent.",
    ...(isDev ? { resetToken: token } : {}),
  };
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) throw badRequest("Invalid or expired reset token");
  if (resetToken.usedAt) throw badRequest("Reset token has already been used");
  if (resetToken.expiresAt < new Date())
    throw badRequest("Reset token has expired");

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);
}
