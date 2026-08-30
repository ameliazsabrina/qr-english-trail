import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default("0.0.0.0"),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  SQLITE_PATH: z.string().min(1).default("./data/bonjotan.sqlite"),
  SESSION_TOKEN_PEPPER: z.string().min(16).default("development-session-pepper"),
  RECOVERY_CODE_PEPPER: z.string().min(16).default("development-recovery-pepper"),
  SESSION_LIFETIME_DAYS: z.coerce.number().int().min(1).max(365).default(90)
}).superRefine((env, context) => {
  if (env.NODE_ENV !== "production") return;
  if (env.SESSION_TOKEN_PEPPER.length < 32 || env.SESSION_TOKEN_PEPPER === "development-session-pepper") {
    context.addIssue({ code: "custom", path: ["SESSION_TOKEN_PEPPER"], message: "Production session pepper must be at least 32 characters" });
  }
  if (env.RECOVERY_CODE_PEPPER.length < 32 || env.RECOVERY_CODE_PEPPER === "development-recovery-pepper") {
    context.addIssue({ code: "custom", path: ["RECOVERY_CODE_PEPPER"], message: "Production recovery pepper must be at least 32 characters" });
  }
  if (env.SESSION_TOKEN_PEPPER === env.RECOVERY_CODE_PEPPER) {
    context.addIssue({ code: "custom", path: ["RECOVERY_CODE_PEPPER"], message: "Session and recovery peppers must be distinct" });
  }
});

export type AppEnv = z.infer<typeof envSchema>;

export function readEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
