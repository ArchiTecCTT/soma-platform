import { describe, it, expect } from 'vitest';
import { isStaleSandboxState } from './requestSandboxState';

describe('isStaleSandboxState', () => {
  it('returns true if turnId mismatch', () => {
    const result = isStaleSandboxState('turn-1', { turnId: 'turn-2' } as any);
    expect(result).toBe(true);
  });

  it('returns false if turnId matches', () => {
    const result = isStaleSandboxState('turn-1', { turnId: 'turn-1' } as any);
    expect(result).toBe(false);
  });
});
