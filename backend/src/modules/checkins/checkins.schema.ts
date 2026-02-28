import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const CheckInBodySchema = z.object({
  slotId: z.string().uuid(),
});

export const CheckInParamsSchema = z.object({
  id: z.string().uuid(),
});

export const checkInBodyJsonSchema = zodToJsonSchema(CheckInBodySchema);
export const checkInParamsJsonSchema = zodToJsonSchema(CheckInParamsSchema);

export type CheckInBody = z.infer<typeof CheckInBodySchema>;
export type CheckInParams = z.infer<typeof CheckInParamsSchema>;
