import type { FastifyReply, FastifyRequest } from "fastify";
import { unauthorized, forbidden } from "../utils/errors.js";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch {
    throw unauthorized("Invalid or missing token");
  }
}

type Role = "ADMIN" | "EMPLOYEE" | "SECURITY";

export function requireRole(...roles: Role[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    await authenticate(request, reply);
    if (!roles.includes(request.user.role as Role)) {
      throw forbidden("Insufficient permissions");
    }
  };
}
