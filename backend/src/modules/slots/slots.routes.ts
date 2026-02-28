import type { FastifyInstance } from "fastify";
import { requireRole } from "../../hooks/authenticate.js";
import {
  createSlotJsonSchema,
  updateSlotJsonSchema,
  slotParamsJsonSchema,
  type CreateSlotInput,
  type UpdateSlotInput,
  type SlotParams,
} from "./slots.schema.js";
import {
  listSlots,
  createSlot,
  updateSlot,
  deleteSlot,
} from "./slots.service.js";

export async function adminSlotsRoutes(app: FastifyInstance) {
  const adminOnly = { preHandler: requireRole("ADMIN") };

  app.get(
    "/",
    { preHandler: requireRole("ADMIN", "SECURITY") },
    async (_request, reply) => {
      const slots = await listSlots();
      return reply.send({ slots });
    }
  );

  app.post<{ Body: CreateSlotInput }>(
    "/",
    { ...adminOnly, schema: { body: createSlotJsonSchema } },
    async (request, reply) => {
      const slot = await createSlot(request.body);
      return reply.status(201).send(slot);
    }
  );

  app.put<{ Params: SlotParams; Body: UpdateSlotInput }>(
    "/:id",
    {
      ...adminOnly,
      schema: { params: slotParamsJsonSchema, body: updateSlotJsonSchema },
    },
    async (request, reply) => {
      const slot = await updateSlot(request.params.id, request.body);
      return reply.send(slot);
    }
  );

  app.delete<{ Params: SlotParams }>(
    "/:id",
    { ...adminOnly, schema: { params: slotParamsJsonSchema } },
    async (request, reply) => {
      await deleteSlot(request.params.id);
      return reply.status(204).send();
    }
  );
}
