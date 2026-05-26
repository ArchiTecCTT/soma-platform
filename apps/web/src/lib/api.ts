export interface LiveKitTokenResponse {
  wsUrl: string;
  token: string;
}

/**
 * Fetches LiveKit WebSocket URL and token from the backend.
 */
export async function fetchLiveKitToken(
  apiBaseUrl: string,
  room: string,
  identity: string
): Promise<LiveKitTokenResponse> {
  const normalizedBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const url = `${normalizedBase}/livekit/token?room=${encodeURIComponent(room)}&identity=${encodeURIComponent(identity)}`;

  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Token fetch failed: ${response.status}`);
  }

  return response.json();
}
