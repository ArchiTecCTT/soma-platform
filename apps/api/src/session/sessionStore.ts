import { randomBytes } from 'node:crypto';

/**
 * In-memory server-side session store.
 * Matches the replayStore pattern: Map + TTL cleanup.
 * Acceptable for single-process MVP.
 */

export interface SessionData {
  /** JTI from the handoff token that bootstrapped this session */
  handoffJti: string;
  /** LiveKit participant name assigned during bootstrap */
  participantName: string;
  /** LiveKit room name assigned during bootstrap */
  roomName: string;
  /** RFC3339 creation timestamp */
  createdAt: string;
  /** Unix timestamp (seconds) when this session expires */
  expiresAt: number;
}

interface SessionEntry {
  data: SessionData;
}

const SESSION_TTL_SECONDS = 86_400; // 24 hours
const CLEANUP_INTERVAL_MS = 60_000;

const store = new Map<string, SessionEntry>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Generate a cryptographically random session ID.
 */
export function generateSessionId(): string {
  // 32 bytes = 256 bits of entropy, base64url encoded = 43 chars
  const bytes = Buffer.from(randomBytes(32));
  return bytes.toString('base64url');
}

/**
 * Create a new session and return its ID.
 * Stores session data with TTL-based expiration.
 */
export function createSession(data: SessionData): string {
  const id = generateSessionId();
  store.set(id, { data });
  return id;
}

/**
 * Retrieve a session by ID.
 * Returns undefined if not found or expired.
 */
export function getSession(id: string): SessionData | undefined {
  const entry = store.get(id);
  if (!entry) return undefined;

  const now = Date.now() / 1000;
  if (now > entry.data.expiresAt) {
    store.delete(id);
    return undefined;
  }

  return entry.data;
}

/**
 * Delete a session (logout).
 */
export function deleteSession(id: string): void {
  store.delete(id);
}

/**
 * Extend the session TTL (refresh on activity).
 */
export function touchSession(id: string): boolean {
  const entry = store.get(id);
  if (!entry) return false;

  const now = Date.now() / 1000;
  if (now > entry.data.expiresAt) {
    store.delete(id);
    return false;
  }

  // Refresh TTL from now
  entry.data.expiresAt = Math.floor(now + SESSION_TTL_SECONDS);
  return true;
}

export function getSessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS;
}

/**
 * Start periodic cleanup of expired entries.
 */
export function startSessionCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now() / 1000;
    for (const [id, entry] of store.entries()) {
      if (now > entry.data.expiresAt) {
        store.delete(id);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Don't prevent process exit (important for tests and CLI usage)
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Stop cleanup timer (for testing).
 */
export function stopSessionCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Clear all sessions (for testing only).
 */
export function clearSessions(): void {
  store.clear();
}