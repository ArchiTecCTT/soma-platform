import { SessionEvent, SessionEventSchema } from '@soma/shared';

const CSRF_COOKIE = '__Host-soma-csrf';
const CSRF_COOKIE_FALLBACK = 'soma-csrf';

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export async function postSessionEvent(apiBaseUrl: string, event: SessionEvent): Promise<any> {
  const parsedEvent = SessionEventSchema.parse(event);
  const base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const url = `${base}/events`;

  const csrf = getCookie(CSRF_COOKIE) || getCookie(CSRF_COOKIE_FALLBACK);

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-Session-Token': csrf } : {}),
    },
    body: JSON.stringify(parsedEvent),
  });

  if (!response.ok) {
    throw new Error(`Event post failed: ${response.status}`);
  }

  return response.json();
}