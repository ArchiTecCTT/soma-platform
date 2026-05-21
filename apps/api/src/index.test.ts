import { describe, it, expect, vi } from 'vitest';
import { createApp } from './index';

describe('Soma API Endpoints', () => {
  const mockEnv = {
    LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
    LIVEKIT_API_KEY: 'key',
    LIVEKIT_API_SECRET: 'secret',
    API_PORT: '8787',
    EVENTS_DIR: 'data/session-events',
  };

  it('GET /health returns 200 and {ok:true}', async () => {
    const app = createApp(mockEnv);
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it('GET /livekit/token returns token with defaults', async () => {
    const app = createApp(mockEnv);
    const res = await app.request('/livekit/token');
    expect(res.status).toBe(200);
    const body = await res.json() as { wsUrl: string; token: string };
    expect(body.wsUrl).toBe('wss://example.livekit.cloud');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(20);
  });

  it('GET /livekit/token?room=soma-mv&identity=user-1 returns token with query params', async () => {
    const app = createApp(mockEnv);
    const res = await app.request('/livekit/token?room=soma-mvp&identity=user-1');
    expect(res.status).toBe(200);
    const body = await res.json() as { wsUrl: string; token: string };
    expect(body.wsUrl).toBe('wss://example.livekit.cloud');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(20);
  });
});
