import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const CreateFlagSchema = z.object({
  slotId: z.string().uuid(),
  vehicleId: z.string().min(1),
});

export const FlagParamsSchema = z.object({
  id: z.string().uuid(),
});

export const FlagQuerySchema = z.object({
  resolved: z.enum(["true", "false"]).optional(),
});

export const createFlagJsonSchema = zodToJsonSchema(CreateFlagSchema);
export const flagParamsJsonSchema = zodToJsonSchema(FlagParamsSchema);

export type CreateFlagInput = z.infer<typeof CreateFlagSchema>;
export type FlagParams = z.infer<typeof FlagParamsSchema>;
export type FlagQuery = z.infer<typeof FlagQuerySchema>;
