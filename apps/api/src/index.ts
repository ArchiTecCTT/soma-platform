import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseApiEnv } from './env';
import { createLiveKitJoinToken } from './livekit-token';
import { SessionEventSchema } from '@soma/shared';
import { appendSessionEvent } from './store/fileEventStore';
import { verifyHandoffToken } from './handoff/verifyHandoffToken';
import { createSessionBootstrap } from './handoff/createSessionBootstrap';
import { isReplayJti, recordJti } from './handoff/replayStore';
import { z } from 'zod';
import * as crypto from 'crypto';

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

  // NOTE: /livekit/token is intentionally unauthenticated for local preview.
  // The web app uses this endpoint without auth headers.
  // Auth will be added via env-gated restriction in future when env schema supports it.
  app.get('/livekit/token', async (c) => {
    const room = c.req.query('room') || 'soma-mvp';
    const identity = c.req.query('identity') || `user-${crypto.randomUUID()}`;

    const tokenData = await createLiveKitJoinToken(env, room, identity);
    return c.json(tokenData);
  });

  app.post('/handoff/bootstrap', async (c) => {
    try {
      let body: any;
      try {
        body = await c.req.json();
      } catch (err) {
        return c.json({ error: 'Invalid JSON body' }, 400);
      }

      if (!body || typeof body.handoff !== 'string') {
        return c.json({ error: 'Missing handoff token' }, 401);
      }

      let payload;
      try {
        payload = verifyHandoffToken(body.handoff, env.RAMS_SHARED_SECRET);
      } catch (tokenErr: any) {
        return c.json({ error: tokenErr.message || 'Invalid token' }, 401);
      }

      // Replay protection: reject duplicate JTI until expiration
      if (isReplayJti(payload.jti, payload.exp)) {
        return c.json({ error: 'Token has already been used' }, 401);
      }

      try {
        const bootstrapData = await createSessionBootstrap(env, payload);
        // Record JTI after successful bootstrap to prevent replay
        recordJti(payload.jti, payload.exp);
        return c.json(bootstrapData);
      } catch (bootstrapErr: any) {
        return c.json({ error: 'Failed to bootstrap session' }, 500);
      }
    } catch (err: any) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  });

  app.post('/events', async (c) => {
    let body: any;
    try {
      body = await c.req.json();
    } catch (err) {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    try {
      const event = SessionEventSchema.parse(body);
      const filePath = await appendSessionEvent(env.EVENTS_DIR, event);
      return c.json({ ok: true, filePath });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const issues = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        return c.json({ error: `Validation failed: ${issues}` }, 400);
      }
      return c.json({ error: 'Internal server error' }, 400);
    }
  });

  return app;
}
