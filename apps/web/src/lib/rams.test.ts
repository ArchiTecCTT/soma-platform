import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeSandbox } from './rams';

describe('analyzeSandbox', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts sandbox analysis to the API', async () => {
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
      headers: { 'Content-Type': 'application/json' },
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
});
