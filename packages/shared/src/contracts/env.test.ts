import { describe, expect, it } from 'vitest';
import { apiEnvSchema, agentEnvSchema, webEnvSchema, parseAgentEnv, parseWebEnv } from './env';

describe('runtime env schemas', () => {
  it('accepts valid API env', () => {
    const result = apiEnvSchema.parse({
      LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
      LIVEKIT_API_KEY: 'key',
      LIVEKIT_API_SECRET: 'secret',
      API_PORT: '8787',
      EVENTS_DIR: 'data/session-events',
      RAMS_SHARED_SECRET: 'test-secret',
    });

    expect(result.API_PORT).toBe(8787);
  });

  it('defaults Azure realtime deployment and mentor mode', () => {
    const result = agentEnvSchema.parse({
      LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
      LIVEKIT_API_KEY: 'key',
      LIVEKIT_API_SECRET: 'secret',
      AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
      AZURE_OPENAI_API_KEY: 'azure-key',
    });

    expect(result.AZURE_OPENAI_REALTIME_DEPLOYMENT).toBe('gpt-realtime-mini');
    expect(result.OPENAI_API_VERSION).toBe('2025-04-01-preview');
    expect(result.MENTOR_MODE).toBe('technical');
    expect(result.API_BASE_URL).toBe('http://localhost:8787');
    expect(result.VAD_ENDPOINTING_MIN_DELAY_MS).toBe(1000);
    expect(result.VAD_ENDPOINTING_MAX_DELAY_MS).toBe(3000);
  });

  it('accepts valid agent env', () => {
    const result = agentEnvSchema.parse({
      LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
      LIVEKIT_API_KEY: 'key',
      LIVEKIT_API_SECRET: 'secret',
      AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
      AZURE_OPENAI_API_KEY: 'azure-key',
      AZURE_OPENAI_REALTIME_DEPLOYMENT: 'gpt-realtime-mini',
      MENTOR_MODE: 'philosophy',
      VAD_ENDPOINTING_MIN_DELAY_MS: '1500',
      VAD_ENDPOINTING_MAX_DELAY_MS: '4500',
    });

    expect(result.API_BASE_URL).toBe('http://localhost:8787');
    expect(result.MENTOR_MODE).toBe('philosophy');
    expect(result.VAD_ENDPOINTING_MIN_DELAY_MS).toBe(1500);
    expect(result.VAD_ENDPOINTING_MAX_DELAY_MS).toBe(4500);
  });

  it('accepts valid web env with default', () => {
    const result = webEnvSchema.parse({});

    expect(result.VITE_API_BASE_URL).toBe('http://localhost:8787');
  });

  it('parseAgentEnv helper works', () => {
    const result = parseAgentEnv({
      LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
      LIVEKIT_API_KEY: 'key',
      LIVEKIT_API_SECRET: 'secret',
      AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
      AZURE_OPENAI_API_KEY: 'azure-key',
    });

    expect(result.AZURE_OPENAI_REALTIME_DEPLOYMENT).toBe('gpt-realtime-mini');
  });

  it('parseWebEnv helper works with default', () => {
    const result = parseWebEnv({});

    expect(result.VITE_API_BASE_URL).toBe('http://localhost:8787');
  });
});
