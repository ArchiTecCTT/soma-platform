import * as openai from '@livekit/agents-plugin-openai';
import { voice } from '@livekit/agents';
import { AgentEnv } from '@soma/shared';

export interface AzureRealtimeOptions {
  azureDeployment: string;
  azureEndpoint: string;
  apiKey: string;
  apiVersion: string;
  voice: 'alloy' | 'echo' | 'shimmer';
  inputAudioTranscription?: {
    model: string;
  };
}

/**
 * Builds the TurnHandlingOptions object from the parsed agent environment.
 */
export function buildTurnHandlingOptions(env: AgentEnv): NonNullable<voice.AgentSessionOptions['turnHandling']> {
  return {
    turnDetection: 'realtime_llm',
    endpointing: {
      mode: 'fixed',
      minDelay: env.VAD_ENDPOINTING_MIN_DELAY_MS,
      maxDelay: env.VAD_ENDPOINTING_MAX_DELAY_MS,
    },
  };
}

/**
 * Builds the Azure Realtime options object from the parsed agent environment.
 */
export function buildAzureRealtimeOptions(env: AgentEnv): AzureRealtimeOptions {
  const options: AzureRealtimeOptions = {
    azureDeployment: env.AZURE_OPENAI_REALTIME_DEPLOYMENT,
    azureEndpoint: env.AZURE_OPENAI_ENDPOINT,
    apiKey: env.AZURE_OPENAI_API_KEY,
    apiVersion: env.OPENAI_API_VERSION,
    voice: 'alloy',
  };

  if (env.AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT) {
    options.inputAudioTranscription = {
      model: env.AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT,
    };
  }

  return options;
}

/**
 * Creates and returns the Azure RealtimeModel using the verified SDK methods.
 */
export function createAzureRealtimeModel(env: AgentEnv): openai.realtime.RealtimeModel {
  const options = buildAzureRealtimeOptions(env);
  return openai.realtime.RealtimeModel.withAzure(options);
}
