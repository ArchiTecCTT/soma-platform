import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { postAgentEvent } from './events';

describe('postAgentEvent', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('posts event and resolves successfully', async () => {
    const mockResponse = { ok: true };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const event = {
      sessionId: 'session-123',
      kind: 'user.message' as const,
      payload: { text: 'hello' },
      createdAt: new Date().toISOString(),
    };

    const res = await postAgentEvent('http://localhost:8787/', event);
    expect(res).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8787/events',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('throws an error if fetch fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const event = {
      sessionId: 'session-123',
      kind: 'user.message' as const,
      payload: { text: 'hello' },
      createdAt: new Date().toISOString(),
    };

    await expect(postAgentEvent('http://localhost:8787', event)).rejects.toThrow(
      'Agent event post failed: 500'
    );
  });

  it('aborts the fetch if it times out', async () => {
    let aborted = false;
    globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
      const signal = options.signal;
      if (signal) {
        signal.addEventListener('abort', () => {
          aborted = true;
        });
      }
      return new Promise((_resolve) => {
        // never resolves to simulate timeout
      });
    });

    const event = {
      sessionId: 'session-123',
      kind: 'user.message' as const,
      payload: { text: 'hello' },
      createdAt: new Date().toISOString(),
    };

    const promise = postAgentEvent('http://localhost:8787', event);

    // Fast-forward timers to trigger abort
    vi.advanceTimersByTime(10000);

    expect(aborted).toBe(true);
  });
});
