import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export async function jwtPlugin(app: FastifyInstance) {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: "8h" },
  });
}
