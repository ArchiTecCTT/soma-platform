import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseApiEnv } from './env';
import { createLiveKitJoinToken } from './livekit-token';
import { SessionEventSchema } from '@soma/shared';
import { appendSessionEvent } from './store/fileEventStore';
import { verifyHandoffToken } from './handoff/verifyHandoffToken';
import { createSessionBootstrap } from './handoff/createSessionBootstrap';
import { consumeReplayJti } from './handoff/replayStore';
import {
  createSession,
  generateCsrfToken,
  getSessionTtlSeconds,
  buildSessionCookies,
  sessionMiddleware,
  csrfMiddleware,
  startSessionCleanup,
} from './session';
import { z } from 'zod';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------//
// Simple in-memory rate limiter for /rams/analyze                                //
// Tracks request count per IP within a 1-minute sliding window.                  //
// ---------------------------------------------------------------------------//
interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 proxied Gemini calls per IP per minute

/** Clears the in-memory rate-limit map. Exported for test isolation. */
export function resetRateLimitMap(): void {
  rateLimitMap.clear();
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

function parseAllowedOrigins(value: string) {
  return new Set(value.split(',').map(origin => origin.trim()).filter(Boolean));
}

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
  startSessionCleanup();
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_WEB_ORIGINS);

  // NOTE: allowedOrigins is passed as a Set; cors with function origin receives
  // (origin) => boolean, which Hono/cors accepts via the `origin` option as a
  // string array or a callback.
  app.use(
    '*',
    cors({
      origin: (origin: string) => {
        if (allowedOrigins.has(origin)) return origin;
        // Allow requests with no Origin header (e.g., same-origin curl/test)
        if (!origin) return '*';
        // Reject unknown origins
        return '';
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
      credentials: true,
    })
  );

  app.get('/health', (c) => {
    return c.json({ ok: true });
  });

  // Session + CSRF middleware: /health and /handoff/bootstrap skip session validation.
  // /livekit/token is protected — requires a valid session cookie.
  const publicPaths = ['/health', '/handoff/bootstrap'];
  app.use('*', sessionMiddleware(publicPaths));
  app.use('*', csrfMiddleware(publicPaths, allowedOrigins));

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

        // Create a server-side session tied to this handoff
        const sessionId = createSession({
          handoffJti: payload.jti,
          participantName: bootstrapData.participantName,
          roomName: bootstrapData.roomName,
          createdAt: new Date().toISOString(),
          expiresAt: Math.floor(Date.now() / 1000) + getSessionTtlSeconds(),
        });

        // Generate CSRF token for this session
        const csrfToken = generateCsrfToken();
        const ttl = getSessionTtlSeconds();
        const secure = c.req.header('x-forwarded-proto') === 'https'
          || c.req.header('origin')?.startsWith('https://') === true
          || c.req.url.startsWith('https://');
        for (const ch of buildSessionCookies(sessionId, csrfToken, ttl, secure)) {
          c.header('Set-Cookie', ch, { append: true });
        }

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

      // Rate-limit check using client IP (from c.req.header('x-forwarded-for') orCF-Connecting-IP, falling back to 'unknown').
      const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
        ?? c.req.header('cf-connecting-ip')?.trim()
        ?? c.req.header('x-real-ip')?.trim()
        ?? 'unknown';
      if (!checkRateLimit(ip)) {
        return c.json({ error: 'Rate limit exceeded. Try again in 1 minute.' }, 429);
      }

      const GEMINI_TIMEOUT_MS = 30_000;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

      let fetchResponse: Response;
      try {
        fetchResponse = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': env.GEMINI_API_KEY!,
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
            signal: controller.signal,
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      const payload = await fetchResponse.json();

      if (!fetchResponse.ok) {
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
      // SurfaceAbortError is thrown when AbortController.abort() is called via timeout
      if (err instanceof Error && err.name === 'AbortError') {
        return c.json({ error: 'RAMS reasoning request timed out after 30 seconds.' }, 504);
      }
      return c.json({ error: 'Failed to generate RAMS critique' }, 500);
    }
  });

  return app;
}
