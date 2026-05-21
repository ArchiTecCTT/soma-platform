import * as openai from '@livekit/agents-plugin-openai';
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
