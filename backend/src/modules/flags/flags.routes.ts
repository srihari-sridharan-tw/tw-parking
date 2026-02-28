import type { FastifyInstance } from "fastify";
import { requireRole } from "../../hooks/authenticate.js";
import {
  createFlagJsonSchema,
  flagParamsJsonSchema,
  FlagQuerySchema,
  type CreateFlagInput,
  type FlagParams,
  type FlagQuery,
} from "./flags.schema.js";
import { createFlag, listFlags, resolveFlag } from "./flags.service.js";

export async function flagsRoutes(app: FastifyInstance) {
  // Security: flag an unauthorised vehicle in an empty slot
  app.post<{ Body: CreateFlagInput }>(
    "/",
    {
      preHandler: requireRole("SECURITY"),
      schema: { body: createFlagJsonSchema },
    },
    async (request, reply) => {
      const flag = await createFlag(request.user.userId, request.body);
      return reply.status(201).send(flag);
    }
  );

  // Admin + Security: list all flags (optionally filter by resolved status)
  app.get<{ Querystring: FlagQuery }>(
    "/",
    { preHandler: requireRole("ADMIN", "SECURITY") },
    async (request, reply) => {
      const parsed = FlagQuerySchema.safeParse(request.query);
      const resolvedFilter = parsed.success ? parsed.data.resolved : undefined;
      const flags = await listFlags(resolvedFilter);
      return reply.send({ flags });
    }
  );

  // Admin: resolve a flag
  app.patch<{ Params: FlagParams }>(
    "/:id/resolve",
    { preHandler: requireRole("ADMIN"), schema: { params: flagParamsJsonSchema } },
    async (request, reply) => {
      const flag = await resolveFlag(request.params.id, request.user.userId);
      return reply.send(flag);
    }
  );
}
