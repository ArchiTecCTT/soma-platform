import { apiEnvSchema, type ApiEnv, parseApiEnv as sharedParseApiEnv } from '@soma/shared';

export function parseApiEnv(env: Record<string, string | undefined>): ApiEnv {
  return sharedParseApiEnv(env);
}
