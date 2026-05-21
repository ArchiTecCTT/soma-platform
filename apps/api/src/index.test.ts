import { describe, it, expect, vi } from 'vitest';
import { createApp } from './index';
import { promises as fs } from 'fs';
import * as path from 'path';

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
        headers: { 'Content-Type': 'application/json' },
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
});
