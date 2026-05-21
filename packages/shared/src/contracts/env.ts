import { z } from 'zod';

const url = z.string().url();
const required = z.string().min(1);

export const apiEnvSchema = z.object({
  LIVEKIT_WS_URL: url,
  LIVEKIT_API_KEY: required,
  LIVEKIT_API_SECRET: required,
  API_PORT: z.coerce.number().default(8787),
  EVENTS_DIR: z.string().default('data/session-events'),
});

export const agentEnvSchema = z.object({
  LIVEKIT_WS_URL: url,
  LIVEKIT_API_KEY: required,
  LIVEKIT_API_SECRET: required,
  AZURE_OPENAI_ENDPOINT: url,
  AZURE_OPENAI_API_KEY: required,
  AZURE_OPENAI_REALTIME_DEPLOYMENT: z.string().default('gpt-realtime-2'),
  AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT: z.string().optional().default('gpt-realtime-whisper'),
  OPENAI_API_VERSION: z.string().default('2025-04-01-preview'),
  EVENTS_DIR: z.string().default('data/session-events'),
  API_BASE_URL: url.default('http://localhost:8787'),
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

export function parseAgentEnv(env: Record<string, string | undefined>) {
  return agentEnvSchema.parse(env);
}

export function parseWebEnv(env: Record<string, string | undefined>) {
  return webEnvSchema.parse(env);
}