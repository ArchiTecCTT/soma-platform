import { describe, expect, it } from 'vitest';
import { createTurnId } from './turns';

describe('createTurnId', () => {
  it('creates turn ID with crypto.randomUUID when available', () => {
    const turnId = createTurnId();
    // Prefix 'turn-' followed by a valid UUID format
    expect(turnId).toMatch(/^turn-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
  });

  it('falls back to Math.random when globalThis.crypto is unavailable', () => {
    // Temporarily mock globalThis.crypto to undefined
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      const turnId = createTurnId();
      // Prefix 'turn-' followed by exactly 4 hex segments separated by hyphens (fallback implementation)
      expect(turnId).toMatch(/^turn-[0-9a-fA-F]+-[0-9a-fA-F]+-[0-9a-fA-F]+-[0-9a-fA-F]+$/);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
        writable: true,
      });
    }
  });
});
