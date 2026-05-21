import crypto from 'crypto';

/**
 * Creates a unique identifier for a dialogue or reasoning turn.
 */
export function createTurnId(): string {
  return `turn-${crypto.randomUUID()}`;
}
