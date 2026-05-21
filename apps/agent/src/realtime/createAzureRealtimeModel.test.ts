import { describe, it, expect } from 'vitest';
import { buildAzureRealtimeOptions } from './createAzureRealtimeModel';

describe('buildAzureRealtimeOptions', () => {
  it('correctly maps environment variables to options', () => {
    const mockEnv = {
      LIVEKIT_WS_URL: 'ws://localhost:7880',
      LIVEKIT_API_KEY: 'test-api-key',
      LIVEKIT_API_SECRET: 'test-api-secret',
      AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
      AZURE_OPENAI_API_KEY: 'azure-key',
      AZURE_OPENAI_REALTIME_DEPLOYMENT: 'gpt-realtime-2',
      AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT: 'gpt-realtime-whisper',
      OPENAI_API_VERSION: '2025-04-01-preview',
      API_BASE_URL: 'http://localhost:8787',
      EVENTS_DIR: 'data/session-events'
    };

    const options = buildAzureRealtimeOptions(mockEnv);

    expect(options.azureDeployment).toBe('gpt-realtime-2');
    expect(options.apiVersion).toBe('2025-04-01-preview');
    expect(options.azureEndpoint).toBe('https://example.openai.azure.com');
    expect(options.inputAudioTranscription?.model).toBe('gpt-realtime-whisper');
  });
});
