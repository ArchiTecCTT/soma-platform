const CSRF_COOKIE = '__Host-soma-csrf';
const CSRF_COOKIE_FALLBACK = 'soma-csrf';

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export function csrfHeader(): Record<string, string> {
  const csrf = getCookie(CSRF_COOKIE) || getCookie(CSRF_COOKIE_FALLBACK);
  return csrf ? { 'X-Session-Token': csrf } : {};
}