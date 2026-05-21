import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseApiEnv } from './env';
import { createLiveKitJoinToken } from './livekit-token';

export function createApp(rawEnv: Record<string, string | undefined>) {
  const env = parseApiEnv(rawEnv);
  const app = new Hono();

  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.get('/health', (c) => {
    return c.json({ ok: true });
  });

  app.get('/livekit/token', async (c) => {
    const room = c.req.query('room') || 'soma-mvp';
    const identity = c.req.query('identity') || `user-${crypto.randomUUID()}`;

    const tokenData = await createLiveKitJoinToken(env, room, identity);
    return c.json(tokenData);
  });

  return app;
}
