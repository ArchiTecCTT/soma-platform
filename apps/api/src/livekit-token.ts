import { AccessToken } from 'livekit-server-sdk';
import { type ApiEnv } from '@soma/shared';

export async function createLiveKitJoinToken(
  env: ApiEnv,
  room: string,
  identity: string
) {
  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity,
    ttl: '15m',
  });

  token.addGrant({
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return {
    wsUrl: env.LIVEKIT_WS_URL,
    token: await token.toJwt(),
  };
}
