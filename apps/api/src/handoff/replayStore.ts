/**
 * Simple in-process replay protection store for handoff JTIs.
 * Uses a Map with TTL-based cleanup. Suitable for single-process MVP.
 * Not race-safe across multiple processes - acceptable for current single API process.
 */

interface ReplayEntry {
  exp: number; // Unix timestamp (seconds) when this JTI expires
}

const replayStore = new Map<string, ReplayEntry>();

// Cleanup interval: run every 60 seconds
const CLEANUP_INTERVAL_MS = 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Check if a JTI has already been used (replay attack).
 * Returns true if duplicate (reject).
 * Returns false if new (accept).
 */
export function isReplayJti(jti: string, exp: number): boolean {
  const entry = replayStore.get(jti);
  if (!entry) {
    return false; // New JTI, not a replay
  }
  // If entry exists but is expired, treat as not a replay (cleanup may be lagging)
  if (Date.now() / 1000 > entry.exp) {
    replayStore.delete(jti);
    return false;
  }
  return true; // Duplicate within TTL window
}

/**
 * Record a JTI as used. Call after successful session bootstrap.
 */
export function recordJti(jti: string, exp: number): void {
  replayStore.set(jti, { exp });
}

/**
 * Start periodic cleanup of expired entries.
 * Call once at app startup.
 */
export function startReplayCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now() / 1000;
    for (const [jti, entry] of replayStore.entries()) {
      if (now > entry.exp) {
        replayStore.delete(jti);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Stop cleanup timer. For testing.
 */
export function stopReplayCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Clear all entries. For testing only.
 */
export function clearReplayStore(): void {
  replayStore.clear();
}