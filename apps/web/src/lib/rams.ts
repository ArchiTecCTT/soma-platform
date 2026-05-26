export interface AnalyzeSandboxInput {
  code: string;
  explanation: string;
}

export interface AnalyzeSandboxResponse {
  critique: string;
}

const CSRF_COOKIE = '__Host-soma-csrf';
const CSRF_COOKIE_FALLBACK = 'soma-csrf';

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function csrfHeader(): Record<string, string> {
  const csrf = getCookie(CSRF_COOKIE) || getCookie(CSRF_COOKIE_FALLBACK);
  return csrf ? { 'X-Session-Token': csrf } : {};
}

export async function analyzeSandbox(
  apiBaseUrl: string,
  input: AnalyzeSandboxInput
): Promise<AnalyzeSandboxResponse> {
  const normalizedBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const url = `${normalizedBase}/rams/analyze`;

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeader(),
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : `RAMS analyze failed: ${response.status}`;
    throw new Error(message);
  }

  return payload;
}