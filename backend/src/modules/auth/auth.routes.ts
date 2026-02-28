import type { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import {
  loginJsonSchema,
  registerJsonSchema,
  forgotPasswordJsonSchema,
  resetPasswordJsonSchema,
  type LoginBody,
  type RegisterBody,
  type ForgotPasswordBody,
  type ResetPasswordBody,
} from "./auth.schema.js";
import {
  loginUser,
  registerEmployee,
  forgotPassword,
  resetPassword,
} from "./auth.service.js";
import { env } from "../../config/env.js";

export async function authRoutes(app: FastifyInstance) {
  // Admin + Security login
  app.post<{ Body: LoginBody }>(
    "/login",
    { schema: { body: loginJsonSchema } },
    async (request, reply) => {
      const result = await loginUser(app, request.body, [
        Role.ADMIN,
        Role.SECURITY,
      ]);
      return reply.status(200).send(result);
    }
  );

  // Employee registration
  app.post<{ Body: RegisterBody }>(
    "/register",
    { schema: { body: registerJsonSchema } },
    async (request, reply) => {
      const result = await registerEmployee(app, request.body);
      return reply.status(201).send(result);
    }
  );

  // Employee sign-in
  app.post<{ Body: LoginBody }>(
    "/signin",
    { schema: { body: loginJsonSchema } },
    async (request, reply) => {
      const result = await loginUser(app, request.body, [Role.EMPLOYEE]);
      return reply.status(200).send(result);
    }
  );

  // Forgot password (all roles)
  app.post<{ Body: ForgotPasswordBody }>(
    "/forgot-password",
    { schema: { body: forgotPasswordJsonSchema } },
    async (request, reply) => {
      const isDev = env.NODE_ENV !== "production";
      const result = await forgotPassword(request.body.email, isDev);
      return reply.status(200).send(result);
    }
  );

  // Reset password (all roles)
  app.post<{ Body: ResetPasswordBody }>(
    "/reset-password",
    { schema: { body: resetPasswordJsonSchema } },
    async (request, reply) => {
      await resetPassword(request.body.token, request.body.newPassword);
      return reply.status(200).send({ message: "Password updated successfully" });
    }
  );
}
