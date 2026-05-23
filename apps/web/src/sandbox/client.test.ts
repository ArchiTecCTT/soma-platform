import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SandboxClient, resetGlobalWebContainer } from './client';
import { WebContainer } from '@webcontainer/api';

// Keep mocks hoisted or declared with vi.hoisted to be referenced safely inside vi.mock
const { mockSpawn, mockFs, mockWebContainerInstance } = vi.hoisted(() => {
  const mockSpawn = vi.fn();
  const mockFs = {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  };
  const mockWebContainerInstance = {
    fs: mockFs,
    spawn: mockSpawn,
  };
  return { mockSpawn, mockFs, mockWebContainerInstance };
});

vi.mock('@webcontainer/api', () => {
  return {
    WebContainer: {
      boot: vi.fn().mockResolvedValue(mockWebContainerInstance),
    },
  };
});

describe('SandboxClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalWebContainer();
  });

  it('boots, synchronizes, runs code and snapshots state', async () => {
    // Setup spawn mock behavior
    const mockPipeTo = vi.fn().mockImplementation((writableStream) => {
      // Mock writing '1' to output
      const writer = writableStream.getWriter();
      writer.write('1');
      writer.close();
      return Promise.resolve();
    });

    const mockOutput = {
      pipeTo: mockPipeTo,
    };

    const mockProcess = {
      output: mockOutput,
      exit: Promise.resolve(0),
    };

    mockSpawn.mockResolvedValue(mockProcess);

    const client = new SandboxClient();
    await client.init();

    await client.syncFile('/src/index.js', 'console.log(1);');
    const exitCode = await client.runEntry('/src/index.js');

    expect(exitCode).toBe(0);

    const state = client.snapshot({
      sessionId: 's-1',
      turnId: 't-1',
      maxChars: 4000,
    });

    expect(state.sessionId).toBe('s-1');
    expect(state.turnId).toBe('t-1');
    expect(state.activeFilePath).toBe('/src/index.js');
    expect(state.stdoutTail).toBe('1');
    expect(state.status).toBe('completed');
  });

  it('resets global boot promise on initialization failure', async () => {
    // Force boot to fail once
    const originalBoot = WebContainer.boot;
    WebContainer.boot = vi.fn().mockRejectedValueOnce(new Error('Boot failed'));

    const client = new SandboxClient();
    await expect(client.init()).rejects.toThrow('Boot failed');

    // Restore boot and try again to prove it was reset and can succeed
    WebContainer.boot = vi.fn().mockResolvedValue(mockWebContainerInstance);
    const instance = await client.init();
    expect(instance).toBe(mockWebContainerInstance);

    // Restore original boot
    WebContainer.boot = originalBoot;
  });
});
