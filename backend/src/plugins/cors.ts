import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

export async function corsPlugin(app: FastifyInstance) {
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}
