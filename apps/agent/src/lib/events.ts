import { SessionEvent, SessionEventSchema } from '@soma/shared';

export async function postAgentEvent(apiBaseUrl: string, event: SessionEvent): Promise<any> {
  // Validate with schema
  const parsedEvent = SessionEventSchema.parse(event);

  // Normalize API base URL to remove trailing slash if present
  const base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const url = `${base}/events`;

  const TIMEOUT_MS = 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsedEvent),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Agent event post failed: ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
