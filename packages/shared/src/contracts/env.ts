import { z } from 'zod';

const url = z.string().url();
const required = z.string().min(1);

export const apiEnvSchema = z.object({
  LIVEKIT_WS_URL: url,
  LIVEKIT_API_KEY: required,
  LIVEKIT_API_SECRET: required,
  API_PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  EVENTS_DIR: z.string().default('data/session-events'),
  RAMS_SHARED_SECRET: required,
  GEMINI_API_KEY: z.string().min(1).optional(),
  ALLOWED_WEB_ORIGINS: z.string().default('http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173'),
});

export const agentEnvSchema = z.object({
  LIVEKIT_WS_URL: url,
  LIVEKIT_API_KEY: required,
  LIVEKIT_API_SECRET: required,
  AZURE_OPENAI_ENDPOINT: url,
  AZURE_OPENAI_API_KEY: required,
  AZURE_OPENAI_REALTIME_DEPLOYMENT: z.string().default('gpt-realtime-mini'),
  AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT: z.string().optional().default('gpt-realtime-whisper'),
  OPENAI_API_VERSION: z.string().default('2025-04-01-preview'),
  MENTOR_MODE: z.enum(['technical', 'philosophy']).default('technical'),
  EVENTS_DIR: z.string().default('data/session-events'),
  API_BASE_URL: url.default('http://localhost:8787'),
  VAD_ENDPOINTING_MIN_DELAY_MS: z.coerce.number().int().positive().max(30000).default(1000),
  VAD_ENDPOINTING_MAX_DELAY_MS: z.coerce.number().int().positive().max(30000).default(3000),
}).superRefine((data, ctx) => {
  if (data.VAD_ENDPOINTING_MIN_DELAY_MS > data.VAD_ENDPOINTING_MAX_DELAY_MS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'VAD_ENDPOINTING_MIN_DELAY_MS must be less than or equal to VAD_ENDPOINTING_MAX_DELAY_MS',
      path: ['VAD_ENDPOINTING_MIN_DELAY_MS'],
    });
  }
});

export const webEnvSchema = z.object({
  VITE_API_BASE_URL: url.default('http://localhost:8787'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type AgentEnv = z.infer<typeof agentEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;

// Task-required aliases and helpers
export const AgentEnvSchema = agentEnvSchema;
export const WebEnvSchema = webEnvSchema;

function preprocessEnv(env: Record<string, string | undefined>) {
  const wsUrl = env.LIVEKIT_WS_URL || env.LIVEKIT_URL;
  const cleanWsUrl = wsUrl ? wsUrl.trim().replace(/^['"]|['"]$/g, '').trim() : undefined;
  
  const cleanApiKey = env.LIVEKIT_API_KEY ? env.LIVEKIT_API_KEY.trim().replace(/^['"]|['"]$/g, '').trim() : undefined;
  const cleanApiSecret = env.LIVEKIT_API_SECRET ? env.LIVEKIT_API_SECRET.trim().replace(/^['"]|['"]$/g, '').trim() : undefined;

  return {
    ...env,
    LIVEKIT_WS_URL: cleanWsUrl,
    LIVEKIT_API_KEY: cleanApiKey,
    LIVEKIT_API_SECRET: cleanApiSecret,
  };
}

export function parseApiEnv(env: Record<string, string | undefined>): ApiEnv {
  return apiEnvSchema.parse(preprocessEnv(env));
}

export function parseAgentEnv(env: Record<string, string | undefined>) {
  return agentEnvSchema.parse(preprocessEnv(env));
}

export function parseWebEnv(env: Record<string, string | undefined>) {
  return webEnvSchema.parse(env);
}