import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  employeeId: z.string().min(1),
  vehicleId: z.string().min(1),
  phoneNumber: z.string().min(10).max(15),
});

export const ForgotPasswordBodySchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordBodySchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

export const loginJsonSchema = zodToJsonSchema(LoginBodySchema);
export const registerJsonSchema = zodToJsonSchema(RegisterBodySchema);
export const forgotPasswordJsonSchema = zodToJsonSchema(
  ForgotPasswordBodySchema
);
export const resetPasswordJsonSchema = zodToJsonSchema(ResetPasswordBodySchema);

export type LoginBody = z.infer<typeof LoginBodySchema>;
export type RegisterBody = z.infer<typeof RegisterBodySchema>;
export type ForgotPasswordBody = z.infer<typeof ForgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof ResetPasswordBodySchema>;
