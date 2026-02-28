import type { FastifyInstance } from "fastify";
import { requireRole } from "../../hooks/authenticate.js";
import {
  checkInBodyJsonSchema,
  checkInParamsJsonSchema,
  type CheckInBody,
  type CheckInParams,
} from "./checkins.schema.js";
import {
  getAvailableSlots,
  checkIn,
  checkOut,
  getMyCheckIns,
  forceCheckoutAll,
} from "./checkins.service.js";

export async function employeeSlotsRoutes(app: FastifyInstance) {
  const employeeOnly = { preHandler: requireRole("EMPLOYEE") };

  // Must be registered under /api/slots prefix — literal path beats /:id
  app.get("/available", employeeOnly, async (_request, reply) => {
    const slots = await getAvailableSlots();
    return reply.send({ slots });
  });
}

export async function checkinsRoutes(app: FastifyInstance) {
  const employeeOnly = { preHandler: requireRole("EMPLOYEE") };
  const adminOnly = { preHandler: requireRole("ADMIN") };

  app.post<{ Body: { password: string } }>(
    "/force-checkout",
    adminOnly,
    async (request, reply) => {
      const result = await forceCheckoutAll(
        request.user.userId,
        request.body.password
      );
      return reply.send(result);
    }
  );

  app.post<{ Body: CheckInBody }>(
    "/",
    { ...employeeOnly, schema: { body: checkInBodyJsonSchema } },
    async (request, reply) => {
      const record = await checkIn(request.user.userId, request.body.slotId);
      return reply.status(201).send(record);
    }
  );

  app.patch<{ Params: CheckInParams }>(
    "/:id/checkout",
    { ...employeeOnly, schema: { params: checkInParamsJsonSchema } },
    async (request, reply) => {
      const record = await checkOut(request.user.userId, request.params.id);
      return reply.send(record);
    }
  );

  app.get("/mine", employeeOnly, async (request, reply) => {
    const records = await getMyCheckIns(request.user.userId);
    return reply.send({ checkIns: records });
  });
}
