import { describe, expect, it, vi } from 'vitest';
import { createTurnId } from './turns';

describe('createTurnId', () => {
  it('creates turn ID with crypto.randomUUID when available', () => {
    const turnId = createTurnId();
    expect(turnId).toMatch(/^turn-[0-9a-fA-F]/);
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
      expect(turnId).toMatch(/^turn-[0-9a-fA-F]/);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
        writable: true,
      });
    }
  });
});
