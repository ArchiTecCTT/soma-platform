import { useState, useEffect, useMemo, useCallback } from 'react';
import { SandboxClient } from '../sandbox/client';
import { SandboxState } from '@soma/shared';

export function useSandbox(initialCode = `export function add(a, b) {\n  return a + b;\n}\nconsole.log(add(2, 3));\n`) {
  const client = useMemo(() => new SandboxClient(), []);
  const [code, setCode] = useState(initialCode);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [sandboxState, setSandboxState] = useState<SandboxState | null>(null);

  // Initialize the WebContainer in background
  useEffect(() => {
    client.init().catch((err) => {
      console.error('Failed to initialize Sandbox WebContainer:', err);
      setStatus('failed');
    });
  }, [client]);

  // Sync the latest code to /src/index.js
  const syncActiveFile = useCallback(async (content: string) => {
    setCode(content);
    await client.syncFile('/src/index.js', content);
  }, [client]);

  const run = useCallback(async () => {
    setStatus('running');
    setStdout('');
    setStderr('');

    try {
      // runEntry writes the latest code to the filesystem and executes it
      await client.runEntry('/src/index.js');

      // Generate turn/session metrics
      const sessionId = 'local-preview';
      const turnId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 't-' + Math.random().toString(36).substring(2, 9);
      
      const state = client.snapshot({
        sessionId,
        turnId,
        maxChars: 4000,
      });

      setSandboxState(state);
      setStatus(state.status);
      setStdout(state.stdoutTail || '');
      setStderr(state.stderrTail || '');
    } catch (error) {
      console.error('Sandbox execution error:', error);
      setStatus('failed');
      setStderr(error instanceof Error ? error.message : String(error));
    }
  }, [client, code]);

  return {
    client,
    code,
    setCode: syncActiveFile,
    status,
    stdout,
    stderr,
    sandboxState,
    run,
  };
}

