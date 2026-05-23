import { describe, expect, it } from 'vitest';
import { ReadSandboxStateRequestSchema, SandboxStateSchema, RPC_METHODS } from './rpc';

describe('rpc contracts', () => {
  it('caps maxChars on sandbox reads', () => {
    expect(() =>
      ReadSandboxStateRequestSchema.parse({
        sessionId: 's-1',
        turnId: 't-1',
        maxChars: 9000,
      }),
    ).toThrow();
  });

  it('accepts a bounded sandbox snapshot', () => {
    const result = SandboxStateSchema.parse({
      sessionId: 's-1',
      turnId: 't-1',
      activeFilePath: '/src/index.js',
      files: [{ path: '/src/index.js', content: 'console.log(1);' }],
      stdoutTail: '1',
      stderrTail: '',
      lastCommand: 'node src/index.js',
      exitCode: 0,
      status: 'completed',
      capturedAt: '2026-05-21T00:00:00.000Z',
    });

    expect(result.files).toHaveLength(1);
  });

  it('exports RPC_METHODS constants', () => {
    expect(RPC_METHODS.SANDBOX_GET_STATE).toBe('read_sandbox_state');
    expect(RPC_METHODS.SANDBOX_RUN_COMMAND).toBe('sandbox.runCommand');
  });
});