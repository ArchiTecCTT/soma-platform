import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLiveKitToken } from './api';

describe('fetchLiveKitToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch LiveKit token and wsUrl successfully', async () => {
    const mockResponse = {
      wsUrl: 'wss://example.livekit.cloud',
      token: 'jwt-value',
    };

    const globalFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', globalFetch);

    const result = await fetchLiveKitToken('http://localhost:8787', 'soma-mvp', 'user-1');

    expect(globalFetch).toHaveBeenCalledWith(
      'http://localhost:8787/livekit/token?room=soma-mvp&identity=user-1',
      { credentials: 'include' }
    );
    expect(result).toEqual(mockResponse);
  });

  it('should throw error when token fetch fails', async () => {
    const globalFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal('fetch', globalFetch);

    await expect(fetchLiveKitToken('http://localhost:8787', 'soma-mvp', 'user-1')).rejects.toThrow(
      'Token fetch failed: 500'
    );
  });
});
