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
 * Attempt to consume a JTI atomically.
 * Returns true if JTI is new and was successfully consumed (recorded).
 * Returns false if JTI is a duplicate (already consumed within TTL window) and rejected.
 */
export function consumeReplayJti(jti: string, exp: number): boolean {
  const now = Date.now() / 1000;
  const entry = replayStore.get(jti);
  
  if (entry) {
    if (now > entry.exp) {
      // If it exists but is expired, we can overwrite/re-consume it
      replayStore.set(jti, { exp });
      return true;
    }
    // Already consumed and still valid (active TTL)
    return false;
  }
  
  // New JTI, consume it now
  replayStore.set(jti, { exp });
  return true;
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