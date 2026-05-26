import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseApiEnv } from './env';
import { createLiveKitJoinToken } from './livekit-token';
import { SessionEventSchema } from '@soma/shared';
import { appendSessionEvent } from './store/fileEventStore';
import { verifyHandoffToken } from './handoff/verifyHandoffToken';
import { createSessionBootstrap } from './handoff/createSessionBootstrap';
import { consumeReplayJti } from './handoff/replayStore';
import { z } from 'zod';
import * as crypto from 'crypto';

const ramsAnalyzeSchema = z.object({
  code: z.string().trim().min(1).max(12000),
  explanation: z.string().trim().max(4000).default(''),
});

function buildRamsPrompt(code: string, explanation: string) {
  return `You are RAMS, an adversarial voice-first AI mentor for elite technical builders.
Your job is to challenge weak reasoning, point out hidden assumptions, and push the user to think from first principles.
Do not passively agree. Be sharp, intellectually rigorous, and direct.

Here is the user's current code in the sandbox:
\`\`\`javascript
${code}
\`\`\`

Here is the user's explanation of their reasoning:
"${explanation || 'No explanation provided.'}"

Analyze their code and explanation. Identify if they successfully resolved the race condition (e.g., using atomic operations, locks, or proper timestamp synchronization) and the precision loss.
If they did not, challenge them directly on why their solution fails. If they did, challenge them on edge cases (e.g., clock drift, memory overhead, or starvation).

Keep your response concise (under 4 sentences), highly technical, and adversarial. Do not say "Great job!" or "Excellent!". Start directly with the critique.`;
}

function extractGeminiText(payload: any) {
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: any) => typeof part?.text === 'string' ? part.text : '')
    .join('')
    .trim();

  return text || null;
}

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

      // Replay protection: atomically consume JTI before bootstrap to prevent races and fail closed on error
      if (!consumeReplayJti(payload.jti, payload.exp)) {
        return c.json({ error: 'Token has already been used' }, 401);
      }

      try {
        const bootstrapData = await createSessionBootstrap(env, payload);
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
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  app.post('/rams/analyze', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    try {
      const { code, explanation } = ramsAnalyzeSchema.parse(body);

      if (!env.GEMINI_API_KEY) {
        return c.json({ error: 'RAMS reasoning engine is not configured' }, 503);
      }

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: buildRamsPrompt(code, explanation) }],
            },
          ],
          generationConfig: {
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload?.error?.message || 'Gemini request failed';
        return c.json({ error: `RAMS reasoning request failed: ${message}` }, 502);
      }

      const critique = extractGeminiText(payload) || 'I detect no rigorous reasoning here. Try again.';
      return c.json({ critique });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const issues = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        return c.json({ error: `Validation failed: ${issues}` }, 400);
      }

      return c.json({ error: 'Failed to generate RAMS critique' }, 500);
    }
  });

  return app;
}
