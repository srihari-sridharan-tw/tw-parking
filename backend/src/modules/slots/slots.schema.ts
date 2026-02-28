import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const SLOT_CODE_REGEX = /^[A-Z]\d{4}$/;

export const CreateSlotSchema = z.object({
  slotCode: z
    .string()
    .regex(
      SLOT_CODE_REGEX,
      "Slot code must be one uppercase letter followed by 4 digits (e.g. M4333)"
    ),
  level: z.number().int().min(1),
  type: z.enum(["TWO_WHEELER", "FOUR_WHEELER"]),
});

export const UpdateSlotSchema = CreateSlotSchema.partial();

export const SlotParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createSlotJsonSchema = zodToJsonSchema(CreateSlotSchema);
export const updateSlotJsonSchema = zodToJsonSchema(UpdateSlotSchema);
export const slotParamsJsonSchema = zodToJsonSchema(SlotParamsSchema);

export type CreateSlotInput = z.infer<typeof CreateSlotSchema>;
export type UpdateSlotInput = z.infer<typeof UpdateSlotSchema>;
export type SlotParams = z.infer<typeof SlotParamsSchema>;
