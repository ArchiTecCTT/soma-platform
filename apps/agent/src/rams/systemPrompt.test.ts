import { describe, it, expect } from 'vitest';
import { RAMS_SYSTEM_PROMPT } from './systemPrompt.js';

describe('RAMS System Prompt', () => {
  it('should be a string containing the required adversarial technical mentor characteristics', () => {
    expect(RAMS_SYSTEM_PROMPT).toContain('Do not flatter the user');
    expect(RAMS_SYSTEM_PROMPT).toContain('Ask the user to explain their reasoning');
    expect(RAMS_SYSTEM_PROMPT).toContain('Prefer evidence from the sandbox state');
  });
});
