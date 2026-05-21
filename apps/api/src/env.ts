import { apiEnvSchema, type ApiEnv } from '@soma/shared';

export function parseApiEnv(env: Record<string, string | undefined>): ApiEnv {
  return apiEnvSchema.parse(env);
}
