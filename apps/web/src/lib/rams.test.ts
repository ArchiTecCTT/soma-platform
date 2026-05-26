import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeSandbox } from './rams';

describe('analyzeSandbox', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock document.cookie for CSRF token
    Object.defineProperty(globalThis, 'document', {
      value: {
        cookie: 'soma-csrf=test-csrf-token; __Host-soma-session=test-session-id',
      },
      writable: true,
    });
  });

  it('posts sandbox analysis to the API with session credentials and CSRF header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ critique: 'Your reasoning still ignores atomicity.' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await analyzeSandbox('http://localhost:8787', {
      code: 'const limiter = new RateLimiter();',
      explanation: 'I would serialize access.',
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8787/rams/analyze', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': 'test-csrf-token',
      },
      body: JSON.stringify({
        code: 'const limiter = new RateLimiter();',
        explanation: 'I would serialize access.',
      }),
    });
    expect(result).toEqual({ critique: 'Your reasoning still ignores atomicity.' });
  });

  it('throws API error messages through to the caller', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'RAMS reasoning engine is not configured' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      analyzeSandbox('http://localhost:8787', {
        code: 'const limiter = new RateLimiter();',
        explanation: '',
      })
    ).rejects.toThrow('RAMS reasoning engine is not configured');
  });

  it('works without CSRF cookie (e.g., pre-session requests)', async () => {
    Object.defineProperty(globalThis, 'document', {
      value: { cookie: '' },
      writable: true,
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ critique: 'No CSRF token available.' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await analyzeSandbox('http://localhost:8787', {
      code: 'const x = 1;',
      explanation: 'Test.',
    });

    // Should not include X-Session-Token header when no CSRF cookie present
    const callArgs = fetchMock.mock.calls[0]?.[1] as any;
    expect(callArgs.headers).not.toHaveProperty('X-Session-Token');
    expect(result).toEqual({ critique: 'No CSRF token available.' });
  });
});