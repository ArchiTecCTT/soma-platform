import { AccessToken } from 'livekit-server-sdk';
import { type ApiEnv } from '@soma/shared';

export interface CreateTokenOptions {
  metadata?: string;
  attributes?: Record<string, string>;
}

export async function createLiveKitJoinToken(
  env: ApiEnv,
  room: string,
  identity: string,
  options?: CreateTokenOptions
) {
  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity,
    ttl: '15m',
    metadata: options?.metadata,
    attributes: options?.attributes,
  });

  token.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
  });

  return {
    wsUrl: env.LIVEKIT_WS_URL,
    token: await token.toJwt(),
  };
}
