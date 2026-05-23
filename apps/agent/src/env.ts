import { AgentEnv, parseAgentEnv as sharedParseAgentEnv } from '@soma/shared';

/**
 * Parses agent environment variables robustly using the shared agent environment schema.
 */
export function parseAgentEnv(env: Record<string, string | undefined>): AgentEnv {
  return sharedParseAgentEnv(env);
}
