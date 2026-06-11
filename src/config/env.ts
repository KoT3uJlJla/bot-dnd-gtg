import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ADMIN_TELEGRAM_IDS: z.string().default(""),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
  PORT: z.coerce.number().int().positive().default(3000)
});

function parseTelegramIds(value: string): bigint[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => BigInt(part));
}

const env = envSchema.parse(process.env);

export const config = {
  botToken: env.BOT_TOKEN,
  databaseUrl: env.DATABASE_URL,
  adminTelegramIds: parseTelegramIds(env.ADMIN_TELEGRAM_IDS),
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
  port: env.PORT
} as const;

export function isAdminTelegramId(telegramId: bigint): boolean {
  return config.adminTelegramIds.includes(telegramId);
}
