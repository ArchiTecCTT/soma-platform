/**
 * Session and CSRF middleware for Hono.
 *
 * - Session IDs are opaque server-side IDs stored in HttpOnly cookies.
 * - HTTPS uses __Host- prefixed Secure cookies.
 * - HTTP dev falls back to non-prefixed cookies so localhost works.
 * - State-changing protected routes require an X-Session-Token header matching
 *   the JS-readable CSRF cookie, plus Origin/Referer validation when present.
 */

import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import * as crypto from 'crypto';
import { getSession, touchSession } from './sessionStore';

const SESSION_COOKIE = '__Host-soma-session';
const SESSION_COOKIE_FALLBACK = 'soma-session';
const CSRF_COOKIE = '__Host-soma-csrf';
const CSRF_COOKIE_FALLBACK = 'soma-csrf';
const SESSION_CONTEXT_KEY = 'session';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const DEFAULT_ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
]);

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function isSecureRequest(c: Context): boolean {
  return c.req.header('x-forwarded-proto') === 'https'
    || c.req.header('origin')?.startsWith('https://') === true
    || c.req.url.startsWith('https://');
}

function parseRefererOrigin(referer: string): string {
  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch {
    return '';
  }
}

function readSessionId(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE) ?? getCookie(c, SESSION_COOKIE_FALLBACK);
}

function readCsrfToken(c: Context): string | undefined {
  return getCookie(c, CSRF_COOKIE) ?? getCookie(c, CSRF_COOKIE_FALLBACK);
}

function isSkipped(path: string, skippedPaths: string[]) {
  return skippedPaths.includes(path);
}

export function sessionMiddleware(unauthenticatedPaths: string[] = []) {
  return async (c: Context, next: Next) => {
    if (isSkipped(c.req.path, unauthenticatedPaths)) {
      await next();
      return;
    }

    const sessionId = readSessionId(c);
    if (!sessionId) {
      return c.json({ error: 'Session required. Please start a session via /handoff/bootstrap.' }, 401);
    }

    const sessionData = getSession(sessionId);
    if (!sessionData) {
      const secure = isSecureRequest(c);
      for (const cookie of buildLogoutCookies(secure)) {
        c.header('Set-Cookie', cookie, { append: true });
      }
      return c.json({ error: 'Session expired or invalid. Please start a new session via /handoff/bootstrap.' }, 401);
    }

    c.set(SESSION_CONTEXT_KEY, { id: sessionId, data: sessionData });
    await next();
    touchSession(sessionId);
  };
}

export function csrfMiddleware(unauthenticatedPaths: string[] = [], allowedOrigins = DEFAULT_ALLOWED_ORIGINS) {
  return async (c: Context, next: Next) => {
    if (isSkipped(c.req.path, unauthenticatedPaths) || SAFE_METHODS.has(c.req.method)) {
      await next();
      return;
    }

    const csrfToken = readCsrfToken(c);
    if (!csrfToken) {
      return c.json({ error: 'CSRF token missing. Refresh the page and try again.' }, 403);
    }

    const headerToken = c.req.header('X-Session-Token');
    if (!headerToken || headerToken !== csrfToken) {
      return c.json({ error: 'Invalid CSRF token. If you are seeing this unexpectedly, please refresh the page.' }, 403);
    }

    const origin = c.req.header('origin');
    const referer = c.req.header('referer');
    const parsedOrigin = origin ?? (referer ? parseRefererOrigin(referer) : '');

    if (parsedOrigin && !allowedOrigins.has(parsedOrigin)) {
      return c.json({ error: 'Request origin not allowed.' }, 403);
    }

    c.set('csrfToken', csrfToken);
    await next();
  };
}

export function buildSessionCookies(
  sessionId: string,
  csrfToken: string,
  ttlSeconds: number,
  secure: boolean
) {
  if (secure) {
    return [
      `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ttlSeconds}`,
      `${CSRF_COOKIE}=${csrfToken}; Path=/; Secure; SameSite=Strict; Max-Age=${ttlSeconds}`,
    ];
  }

  return [
    `${SESSION_COOKIE_FALLBACK}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttlSeconds}`,
    `${CSRF_COOKIE_FALLBACK}=${csrfToken}; Path=/; SameSite=Lax; Max-Age=${ttlSeconds}`,
  ];
}

export function buildLogoutCookies(secure: boolean): string[] {
  if (secure) {
    return [
      `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
      `${CSRF_COOKIE}=; Path=/; Secure; SameSite=Strict; Max-Age=0`,
    ];
  }

  return [
    `${SESSION_COOKIE_FALLBACK}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `${CSRF_COOKIE_FALLBACK}=; Path=/; SameSite=Lax; Max-Age=0`,
  ];
}

export function getSessionFromContext(c: Context) {
  return c.get(SESSION_CONTEXT_KEY) as { id: string; data: import('./sessionStore').SessionData } | undefined;
}

export function getSessionCookieNames() {
  return { SESSION_COOKIE, SESSION_COOKIE_FALLBACK, CSRF_COOKIE, CSRF_COOKIE_FALLBACK };
}
