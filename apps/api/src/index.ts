import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseApiEnv } from './env';
import { createLiveKitJoinToken } from './livekit-token';
import { SessionEventSchema } from '@soma/shared';
import { appendSessionEvent } from './store/fileEventStore';
import { verifyHandoffToken } from './handoff/verifyHandoffToken';
import { createSessionBootstrap } from './handoff/createSessionBootstrap';

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

  app.post('/handoff/bootstrap', async (c) => {
    try {
      const body = await c.req.json();
      if (!body || typeof body.handoff !== 'string') {
        return c.json({ error: 'Missing handoff token' }, 401);
      }
      const payload = verifyHandoffToken(body.handoff, env.RAMS_SHARED_SECRET);
      const bootstrapData = await createSessionBootstrap(env, payload);
      return c.json(bootstrapData);
    } catch (err: any) {
      return c.json({ error: err.message || 'Unauthorized' }, 401);
    }
  });

  app.post('/events', async (c) => {
    const body = await c.req.json();
    const event = SessionEventSchema.parse(body);
    const filePath = await appendSessionEvent(env.EVENTS_DIR, event);
    return c.json({ ok: true, filePath });
  });

  return app;
}
