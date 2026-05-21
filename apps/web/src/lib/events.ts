import { SessionEvent, SessionEventSchema } from '@soma/shared';

export async function postSessionEvent(apiBaseUrl: string, event: SessionEvent): Promise<any> {
  // Validate with schema
  const parsedEvent = SessionEventSchema.parse(event);

  // Normalize API base URL to remove trailing slash if present
  const base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const url = `${base}/events`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parsedEvent),
  });

  if (!response.ok) {
    throw new Error(`Event post failed: ${response.status}`);
  }

  return response.json();
}
