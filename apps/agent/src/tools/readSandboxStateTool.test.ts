import { describe, it, expect, vi } from 'vitest';
import { createReadSandboxStateTool } from './readSandboxStateTool';

describe('readSandboxStateTool', () => {
  it('delegates to requestSandboxState and returns bounded snapshot', async () => {
    const mockSnapshot = {
      turnId: 't-1',
      stdoutTail: '1',
      stderrTail: '',
      files: [],
    };

    const requestSandboxState = vi.fn().mockResolvedValue(mockSnapshot);

    const tool = createReadSandboxStateTool(requestSandboxState as never);

    const result = await tool.execute(
      { sessionId: 's-1', turnId: 't-1', maxChars: 4000 },
      { toolCallId: 'call-1', ctx: {} as never }
    );

    expect(requestSandboxState).toHaveBeenCalledWith({
      sessionId: 's-1',
      turnId: 't-1',
      maxChars: 4000,
    });
    expect(result).toBe(JSON.stringify(mockSnapshot));
  });
});
