import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { appendSessionEvent } from './fileEventStore';

describe('fileEventStore', () => {
  it('appends session event to .jsonl file', async () => {
    // TDD test first importing appendSessionEvent from ./fileEventStore.
    // Use mkdtemp/readFile/rm. append event {sessionId:'session-1', kind:'user.message', payload:{text:'hello'}, createdAt:'2026-05-21T00:00:00.000Z'}.
    // Assert session-1.jsonl contains user.message and hello.
    const tempDir = await fs.mkdtemp(path.join(process.env.TEMP || '/tmp', 'soma-test-'));
    try {
      const event = {
        sessionId: 'session-1',
        kind: 'user.message' as const,
        payload: { text: 'hello' },
        createdAt: '2026-05-21T00:00:00.000Z',
      };

      const filePath = await appendSessionEvent(tempDir, event);
      expect(filePath).toBe(path.join(tempDir, 'session-1.jsonl'));

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('user.message');
      expect(content).toContain('hello');
      
      // Ensure it ends with newline
      expect(content.endsWith('\n')).toBe(true);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects sessionId with path traversal or unsafe characters', async () => {
    const tempDir = await fs.mkdtemp(path.join(process.env.TEMP || '/tmp', 'soma-test-'));
    try {
      const unsafeEvent = {
        sessionId: '../session-evil',
        kind: 'user.message' as const,
        payload: { text: 'evil' },
        createdAt: '2026-05-21T00:00:00.000Z',
      };

      await expect(appendSessionEvent(tempDir, unsafeEvent)).rejects.toThrow(
        'Invalid sessionId'
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
