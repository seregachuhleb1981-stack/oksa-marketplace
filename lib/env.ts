import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SUPPLIER_FEED_URL: z.string().url()
});

export function getServerEnv() {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    SUPPLIER_FEED_URL: process.env.SUPPLIER_FEED_URL
  });
}