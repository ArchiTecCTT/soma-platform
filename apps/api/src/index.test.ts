import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearReplayStore } from './handoff/replayStore';
import { createApp, resetRateLimitMap } from './index';
import { clearSessions, createSession, generateCsrfToken, getSessionTtlSeconds } from './session';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

let mockBootstrapShouldFail = false;
vi.mock('./handoff/createSessionBootstrap', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./handoff/createSessionBootstrap')>();
  return {
    ...actual,
    createSessionBootstrap: async (env: any, payload: any) => {
      if (mockBootstrapShouldFail) {
        throw new Error('Simulated bootstrap failure');
      }
      return actual.createSessionBootstrap(env, payload);
    },
  };
});

let mockStoreShouldFail = false;
vi.mock('./store/fileEventStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./store/fileEventStore')>();
  return {
    ...actual,
    appendSessionEvent: async (dir: string, event: any) => {
      if (mockStoreShouldFail) {
        throw new Error('Simulated store failure');
      }
      return actual.appendSessionEvent(dir, event);
    },
  };
});

describe('Soma API Endpoints', () => {
  beforeEach(() => {
    clearReplayStore();
    clearSessions();
    resetRateLimitMap();
  });
  const mockEnv = {
    LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
    LIVEKIT_API_KEY: 'key',
    LIVEKIT_API_SECRET: 'secret',
    API_PORT: '8787',
    EVENTS_DIR: 'data/session-events',
    RAMS_SHARED_SECRET: 'my-super-secret-key-for-testing',
    GEMINI_API_KEY: 'gemini-test-key',
  };

  function createAuthHeaders() {
    const sessionId = createSession({
      handoffJti: `test-${crypto.randomUUID()}`,
      participantName: 'student-test',
      roomName: 'room-test',
      createdAt: new Date().toISOString(),
      expiresAt: Math.floor(Date.now() / 1000) + getSessionTtlSeconds(),
    });
    const csrfToken = generateCsrfToken();
    return {
      cookie: `soma-session=${sessionId}; soma-csrf=${csrfToken}`,
      csrfToken,
      postHeaders: {
        'Content-Type': 'application/json',
        'Cookie': `soma-session=${sessionId}; soma-csrf=${csrfToken}`,
        'X-Session-Token': csrfToken,
      },
      getHeaders: {
        'Cookie': `soma-session=${sessionId}; soma-csrf=${csrfToken}`,
      },
    };
  }

  it('GET /health returns 200 and {ok:true}', async () => {
    const app = createApp(mockEnv);
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it('GET /livekit/token returns token with defaults', async () => {
    const app = createApp(mockEnv);
    const { getHeaders } = createAuthHeaders();
    const res = await app.request('/livekit/token', { headers: getHeaders });
    expect(res.status).toBe(200);
    const body = await res.json() as { wsUrl: string; token: string };
    expect(body.wsUrl).toBe('wss://example.livekit.cloud');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(20);
  });

  it('GET /livekit/token?room=soma-mv&identity=user-1 returns token with query params', async () => {
    const app = createApp(mockEnv);
    const { getHeaders } = createAuthHeaders();
    const res = await app.request('/livekit/token?room=soma-mvp&identity=user-1', { headers: getHeaders });
    expect(res.status).toBe(200);
    const body = await res.json() as { wsUrl: string; token: string };
    expect(body.wsUrl).toBe('wss://example.livekit.cloud');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(20);
  });

  it('GET /livekit/token returns 401 without a session cookie', async () => {
    const app = createApp(mockEnv);
    const res = await app.request('/livekit/token');
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toContain('Session required');
  });

  it('POST /events appends event and returns 200 with ok and filePath', async () => {
    const tempDir = await fs.mkdtemp(path.join(process.env.TEMP || '/tmp', 'soma-api-test-'));
    try {
      const app = createApp({ ...mockEnv, EVENTS_DIR: tempDir });
      const event = {
        sessionId: 'session-api-1',
        kind: 'user.message',
        payload: { text: 'hello from api' },
        createdAt: '2026-05-21T00:00:00.000Z',
      };
      
      const res = await app.request('/events', {
        method: 'POST',
        headers: createAuthHeaders().postHeaders,
        body: JSON.stringify(event),
      });

      expect(res.status).toBe(200);
      const resBody = await res.json() as { ok: boolean; filePath: string };
      expect(resBody.ok).toBe(true);
      expect(resBody.filePath).toBe(path.join(tempDir, 'session-api-1.jsonl'));

      const fileContent = await fs.readFile(resBody.filePath, 'utf-8');
      expect(fileContent).toContain('user.message');
      expect(fileContent).toContain('hello from api');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('POST /events returns 400 for invalid JSON body', async () => {
    const app = createApp(mockEnv);
    const res = await app.request('/events', {
      method: 'POST',
      headers: createAuthHeaders().postHeaders,
      body: '{ invalid-json }',
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Invalid JSON body');
  });

  it('POST /events returns 400 for schema validation error', async () => {
    const app = createApp(mockEnv);
    const res = await app.request('/events', {
      method: 'POST',
      headers: createAuthHeaders().postHeaders,
      body: JSON.stringify({
        sessionId: 'session-api-1',
        kind: 'user.message',
        // Missing payload and createdAt
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toContain('Validation failed');
  });

  it('POST /events returns 500 for non-validation storage failures from appendSessionEvent', async () => {
    mockStoreShouldFail = true;
    try {
      const app = createApp(mockEnv);
      const res = await app.request('/events', {
        method: 'POST',
        headers: createAuthHeaders().postHeaders,
        body: JSON.stringify({
          sessionId: 'session-api-1',
          kind: 'user.message',
          payload: { text: 'hello' },
          createdAt: new Date().toISOString(),
        }),
      });

      expect(res.status).toBe(500);
      const body = await res.json() as { error: string };
      expect(body.error).toBe('Internal server error');
    } finally {
      mockStoreShouldFail = false;
    }
  });

  it('POST /rams/analyze returns 401 without a session cookie', async () => {
    const app = createApp(mockEnv);
    const res = await app.request('/rams/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'const x = 1;', explanation: '' }),
    });

    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toContain('Session required');
  });

  it('POST /rams/analyze returns 503 when GEMINI_API_KEY is missing', async () => {
    const app = createApp({ ...mockEnv, GEMINI_API_KEY: undefined });
    const res = await app.request('/rams/analyze', {
      method: 'POST',
      headers: createAuthHeaders().postHeaders,
      body: JSON.stringify({
        code: 'const x = 1;',
        explanation: 'I would guard shared state with a mutex.',
      }),
    });

    expect(res.status).toBe(503);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('RAMS reasoning engine is not configured');
  });

  it('POST /rams/analyze returns 400 for invalid request payload', async () => {
    const app = createApp(mockEnv);
    const res = await app.request('/rams/analyze', {
      method: 'POST',
      headers: createAuthHeaders().postHeaders,
      body: JSON.stringify({ code: '' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toContain('Validation failed');
  });

  it('POST /rams/analyze proxies critique generation through the server', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                { text: 'Your fix still races on shared token state; make refill and consume atomic.' },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const app = createApp(mockEnv);
    const res = await app.request('/rams/analyze', {
      method: 'POST',
      headers: createAuthHeaders().postHeaders,
      body: JSON.stringify({
        code: 'const x = 1;',
        explanation: 'I would use compare-and-swap.',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { critique: string };
    expect(body.critique).toContain('shared token state');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'x-goog-api-key': 'gemini-test-key',
      }),
    });
  });

  it('POST /rams/analyze returns 429 when rate limit is exceeded (10 req/min)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Critique.' }] } }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const app = createApp(mockEnv);
    const body = JSON.stringify({ code: 'const x = 1;', explanation: 'Reasoning.' });

    // First 10 requests should succeed
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/rams/analyze', {
        method: 'POST',
        headers: createAuthHeaders().postHeaders,
        body,
      });
      expect(res.status).toBe(200);
    }

    // The 11th request should be rate-limited
    const res = await app.request('/rams/analyze', {
      method: 'POST',
      headers: createAuthHeaders().postHeaders,
      body,
    });
    expect(res.status).toBe(429);
    const resBody = await res.json() as { error: string };
    expect(resBody.error).toContain('Rate limit');
  });

  it('POST /rams/analyze returns 504 when Gemini fetch times out', async () => {
    // Simulate an AbortError from the AbortController timeout
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);

    const app = createApp(mockEnv);
    const res = await app.request('/rams/analyze', {
      method: 'POST',
      headers: createAuthHeaders().postHeaders,
      body: JSON.stringify({ code: 'const x = 1;', explanation: 'Reasoning.' }),
    });

    expect(res.status).toBe(504);
    const resBody = await res.json() as { error: string };
    expect(resBody.error).toContain('timed out');
  });

  describe('POST /handoff/bootstrap', () => {
    const secret = 'my-super-secret-key-for-testing';
    
    function createToken(payload: any, hSecret = secret) {
      const header = { alg: 'HS256', typ: 'JWT' };
      const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = crypto
        .createHmac('sha256', hSecret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');
      return `${headerB64}.${payloadB64}.${signature}`;
    }

    it('returns 200 and bootstrap data for a valid handoff token', async () => {
      const app = createApp(mockEnv);
      const payload = {
        iss: 'ornyx-landing-page',
        aud: 'soma-rams-mentor',
        iat: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: 'session-123',
        topic: 'Introduction to Rust',
        curriculum: [
          { step: '01', title: 'Ownership', description: 'Learn pointers and ownership' },
        ],
        socraticQuestion: 'What is a reference?',
      };
      
      const token = createToken(payload);
      
      const res = await app.request('/handoff/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoff: token }),
      });
      
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.topic).toBe('Introduction to Rust');
      expect(body.curriculum).toEqual([
        { step: '01', title: 'Ownership', description: 'Learn pointers and ownership' },
      ]);
      expect(body.socraticQuestion).toBe('What is a reference?');
      expect(body.roomName).toBe('room-session-123');
      expect(body.participantName).toContain('student-');
      expect(body.livekit.url).toBe('wss://example.livekit.cloud');
      expect(typeof body.livekit.token).toBe('string');
    });

    it('returns 401 for an expired token', async () => {
      const app = createApp(mockEnv);
      const payload = {
        iss: 'ornyx-landing-page',
        aud: 'soma-rams-mentor',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 10, // expired!
        jti: 'session-expired',
        topic: 'Expired topic',
        curriculum: [
          { step: '01', title: 'Expired', description: 'Expired curriculum' },
        ],
      };
      
      const token = createToken(payload);
      
      const res = await app.request('/handoff/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoff: token }),
      });
      
      expect(res.status).toBe(401);
      const body = await res.json() as any;
      expect(body.error).toContain('expired');
    });

    it('returns 401 when exp equals exactly now (exclusive expiration rejection)', async () => {
      vi.useFakeTimers();
      const fixedTime = new Date('2026-05-23T12:00:00Z');
      vi.setSystemTime(fixedTime);

      const app = createApp(mockEnv);
      const nowInSec = Math.floor(fixedTime.getTime() / 1000);
      const payload = {
        iss: 'ornyx-landing-page',
        aud: 'soma-rams-mentor',
        iat: nowInSec - 60,
        exp: nowInSec, // exp === now
        jti: 'session-expired-exact',
        topic: 'Expired topic',
        curriculum: [
          { step: '01', title: 'Expired', description: 'Expired curriculum' },
        ],
      };
      
      const token = createToken(payload);
      
      const res = await app.request('/handoff/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoff: token }),
      });
      
      expect(res.status).toBe(401);
      const body = await res.json() as any;
      expect(body.error).toContain('expired');

      vi.useRealTimers();
    });

    it('returns 401 for an invalid signature', async () => {
      const app = createApp(mockEnv);
      const payload = {
        iss: 'ornyx-landing-page',
        aud: 'soma-rams-mentor',
        iat: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: 'session-bad-sig',
        topic: 'Topic',
        curriculum: [
          { step: '01', title: 'Step', description: 'Curriculum' },
        ],
      };
      
      const token = createToken(payload, 'wrong-secret');
      
      const res = await app.request('/handoff/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoff: token }),
      });
      
      expect(res.status).toBe(401);
      const body = await res.json() as any;
      expect(body.error).toContain('signature');
    });

    it('returns 200 for first bootstrap with unique JTI', async () => {
      // Use unique JTI to avoid cross-test interference
      const uniqueJti = `session-first-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const app = createApp(mockEnv);
      const payload = {
        iss: 'ornyx-landing-page',
        aud: 'soma-rams-mentor',
        iat: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: uniqueJti,
        topic: 'First Bootstrap',
        curriculum: [{ step: '01', title: 'Step', description: 'Curriculum' }],
      };
      const token = createToken(payload);
      const res = await app.request('/handoff/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoff: token }),
      });
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.roomName).toBe(`room-${uniqueJti}`);
    });

    it('returns 401 for second bootstrap with same token (replay rejected)', async () => {
      const uniqueJti = `session-replay-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const app = createApp(mockEnv);
      const payload = {
        iss: 'ornyx-landing-page',
        aud: 'soma-rams-mentor',
        iat: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: uniqueJti,
        topic: 'Replay Test',
        curriculum: [{ step: '01', title: 'Step', description: 'Curriculum' }],
      };
      const token = createToken(payload);

      // First bootstrap should succeed
      const res1 = await app.request('/handoff/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoff: token }),
      });
      expect(res1.status).toBe(200);

      // Second bootstrap with same token should be rejected
      const res2 = await app.request('/handoff/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoff: token }),
      });
      expect(res2.status).toBe(401);
      const body2 = await res2.json() as any;
      expect(body2.error).toContain('already been used');
    });

    it('keeps the token consumed to fail closed if bootstrap fails', async () => {
      mockBootstrapShouldFail = true;
      const uniqueJti = `session-fail-closed-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const app = createApp(mockEnv);
      const payload = {
        iss: 'ornyx-landing-page',
        aud: 'soma-rams-mentor',
        iat: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: uniqueJti,
        topic: 'Fail Closed Test',
        curriculum: [{ step: '01', title: 'Step', description: 'Curriculum' }],
      };
      const token = createToken(payload);

      // First bootstrap should fail with 500
      const res1 = await app.request('/handoff/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoff: token }),
      });
      expect(res1.status).toBe(500);

      // Subsequent bootstraps should still be rejected with 401 replay error (failing closed)
      mockBootstrapShouldFail = false;
      const res2 = await app.request('/handoff/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoff: token }),
      });
      expect(res2.status).toBe(401);
      const body2 = await res2.json() as any;
      expect(body2.error).toContain('already been used');
    });
  });
});
