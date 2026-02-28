import { z } from "zod";
import "dotenv/config";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = EnvSchema.parse(process.env);
