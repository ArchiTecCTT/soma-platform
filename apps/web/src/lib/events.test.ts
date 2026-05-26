import { describe, it, expect, vi } from 'vitest';
import { postSessionEvent } from './events';

describe('postSessionEvent', () => {
  it('posts session event correctly', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const event = {
      sessionId: 'session-1',
      turnId: 'turn-1',
      kind: 'user.message' as const,
      payload: { text: 'hello' },
      createdAt: '2026-05-21T00:00:00.000Z',
    };

    const result = await postSessionEvent('http://localhost:8787', event);

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8787/events', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    expect(result).toEqual({ success: true });

    vi.unstubAllGlobals();
  });
});
