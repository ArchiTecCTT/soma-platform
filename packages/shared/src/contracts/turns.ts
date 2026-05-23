/**
 * Creates a unique identifier for a dialogue or reasoning turn.
 */
export function createTurnId(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return `turn-${globalThis.crypto.randomUUID()}`;
  }
  // Math.random-based fallback for non-crypto runtimes
  const randomHex = Array.from({ length: 4 }, () => Math.random().toString(16).substring(2, 10)).join('-');
  return `turn-${randomHex}`;
}
