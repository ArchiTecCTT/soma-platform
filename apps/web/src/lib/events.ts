import { SessionEvent, SessionEventSchema } from '@soma/shared';
import { csrfHeader } from './csrf';

export async function postSessionEvent(apiBaseUrl: string, event: SessionEvent): Promise<any> {
  const parsedEvent = SessionEventSchema.parse(event);
  const base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const url = `${base}/events`;

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeader(),
    },
    body: JSON.stringify(parsedEvent),
  });

  if (!response.ok) {
    throw new Error(`Event post failed: ${response.status}`);
  }

  return response.json();
}