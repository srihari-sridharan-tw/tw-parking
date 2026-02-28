import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import {
  employeeSlotsRoutes,
  checkinsRoutes,
} from "./modules/checkins/checkins.routes.js";
import { adminSlotsRoutes } from "./modules/slots/slots.routes.js";
import { reportsRoutes } from "./modules/reports/reports.routes.js";
import { flagsRoutes } from "./modules/flags/flags.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { AppError } from "./utils/errors.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env["NODE_ENV"] !== "test",
  });

  // Plugins registered directly on root scope so decorations (app.jwt) are
  // visible to all child route plugins without encapsulation issues.
  app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: "8h" },
  });
  app.register(sensible);

  // Routes — order matters:
  // employeeSlotsRoutes registers GET /api/slots/available (literal path)
  // adminSlotsRoutes registers GET|POST|PUT|DELETE /api/slots/:id
  // Registering employee first ensures /available is not captured by /:id
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(employeeSlotsRoutes, { prefix: "/api/slots" });
  app.register(adminSlotsRoutes, { prefix: "/api/slots" });
  app.register(checkinsRoutes, { prefix: "/api/checkins" });
  app.register(reportsRoutes, { prefix: "/api/reports" });
  app.register(flagsRoutes, { prefix: "/api/flags" });
  app.register(usersRoutes, { prefix: "/api/users" });

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
    }

    if (error.validation) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.validation,
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  });

  return app;
}
