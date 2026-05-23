import { describe, it, expect } from 'vitest';
import { buildAzureRealtimeOptions, buildTurnHandlingOptions } from './createAzureRealtimeModel';

describe('buildAzureRealtimeOptions', () => {
  it('correctly maps environment variables to options', () => {
    const mockEnv = {
      LIVEKIT_WS_URL: 'ws://localhost:7880',
      LIVEKIT_API_KEY: 'test-api-key',
      LIVEKIT_API_SECRET: 'test-api-secret',
      AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
      AZURE_OPENAI_API_KEY: 'azure-key',
      AZURE_OPENAI_REALTIME_DEPLOYMENT: 'gpt-realtime-mini',
      AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT: 'gpt-realtime-whisper',
      OPENAI_API_VERSION: '2025-04-01-preview',
      MENTOR_MODE: 'technical' as const,
      API_BASE_URL: 'http://localhost:8787',
      EVENTS_DIR: 'data/session-events',
      VAD_ENDPOINTING_MIN_DELAY_MS: 1000,
      VAD_ENDPOINTING_MAX_DELAY_MS: 3000,
    };

    const options = buildAzureRealtimeOptions(mockEnv);

    expect(options.azureDeployment).toBe('gpt-realtime-mini');
    expect(options.apiVersion).toBe('2025-04-01-preview');
    expect(options.azureEndpoint).toBe('https://example.openai.azure.com');
    expect(options.inputAudioTranscription?.model).toBe('gpt-realtime-whisper');
  });
});

describe('buildTurnHandlingOptions', () => {
  it('correctly builds turn handling options with exact values and milliseconds unit', () => {
    const mockEnv = {
      LIVEKIT_WS_URL: 'ws://localhost:7880',
      LIVEKIT_API_KEY: 'test-api-key',
      LIVEKIT_API_SECRET: 'test-api-secret',
      AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
      AZURE_OPENAI_API_KEY: 'azure-key',
      AZURE_OPENAI_REALTIME_DEPLOYMENT: 'gpt-realtime-mini',
      AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT: 'gpt-realtime-whisper',
      OPENAI_API_VERSION: '2025-04-01-preview',
      MENTOR_MODE: 'technical' as const,
      API_BASE_URL: 'http://localhost:8787',
      EVENTS_DIR: 'data/session-events',
      VAD_ENDPOINTING_MIN_DELAY_MS: 1250,
      VAD_ENDPOINTING_MAX_DELAY_MS: 3750,
    };

    const options = buildTurnHandlingOptions(mockEnv);

    expect(options.turnDetection).toBe('realtime_llm');
    expect(options.endpointing).toBeDefined();
    expect(options.endpointing?.mode).toBe('fixed');
    expect(options.endpointing?.minDelay).toBe(1250); // asserting mapping includes exact values and units are ms
    expect(options.endpointing?.maxDelay).toBe(3750); // asserting mapping includes exact values and units are ms
  });
});
