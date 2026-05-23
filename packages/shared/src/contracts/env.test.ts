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

  it('rejects API_PORT outside of valid TCP port range', () => {
    const baseEnv = {
      LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
      LIVEKIT_API_KEY: 'key',
      LIVEKIT_API_SECRET: 'secret',
      EVENTS_DIR: 'data/session-events',
      RAMS_SHARED_SECRET: 'test-secret',
    };

    expect(() => apiEnvSchema.parse({ ...baseEnv, API_PORT: '0' })).toThrow();
    expect(() => apiEnvSchema.parse({ ...baseEnv, API_PORT: '65536' })).toThrow();
    expect(() => apiEnvSchema.parse({ ...baseEnv, API_PORT: '-1' })).toThrow();
    
    expect(apiEnvSchema.parse({ ...baseEnv, API_PORT: '1' }).API_PORT).toBe(1);
    expect(apiEnvSchema.parse({ ...baseEnv, API_PORT: '65535' }).API_PORT).toBe(65535);
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

  it('rejects agent env where min delay > max delay', () => {
    expect(() => {
      agentEnvSchema.parse({
        LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
        LIVEKIT_API_KEY: 'key',
        LIVEKIT_API_SECRET: 'secret',
        AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
        AZURE_OPENAI_API_KEY: 'azure-key',
        VAD_ENDPOINTING_MIN_DELAY_MS: '2000',
        VAD_ENDPOINTING_MAX_DELAY_MS: '1000',
      });
    }).toThrow(/VAD_ENDPOINTING_MIN_DELAY_MS must be less than or equal to VAD_ENDPOINTING_MAX_DELAY_MS/);
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

  describe('preprocessEnv compatibility and cleaning', () => {
    it('uses LIVEKIT_URL as fallback for LIVEKIT_WS_URL', () => {
      const result = parseAgentEnv({
        LIVEKIT_URL: 'wss://fallback.livekit.cloud',
        LIVEKIT_API_KEY: 'key',
        LIVEKIT_API_SECRET: 'secret',
        AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
        AZURE_OPENAI_API_KEY: 'azure-key',
      });
      expect(result.LIVEKIT_WS_URL).toBe('wss://fallback.livekit.cloud');
    });

    it('cleans quotes and whitespace from environment variables', () => {
      const result = parseAgentEnv({
        LIVEKIT_WS_URL: ' "wss://quoted.livekit.cloud" ',
        LIVEKIT_API_KEY: " 'key-with-quotes' ",
        LIVEKIT_API_SECRET: ' "secret-with-quotes" ',
        AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
        AZURE_OPENAI_API_KEY: 'azure-key',
      });
      expect(result.LIVEKIT_WS_URL).toBe('wss://quoted.livekit.cloud');
      expect(result.LIVEKIT_API_KEY).toBe('key-with-quotes');
      expect(result.LIVEKIT_API_SECRET).toBe('secret-with-quotes');
    });
  });
});
