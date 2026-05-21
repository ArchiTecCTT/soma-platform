import React, { useCallback } from 'react';
import { useSandbox } from '../hooks/useSandbox';
import { postSessionEvent } from '../lib/events';

interface CodeWorkspaceProps {
  sandbox?: ReturnType<typeof useSandbox>;
  apiBaseUrl?: string;
  sessionId?: string;
}

export function CodeWorkspace({ sandbox, apiBaseUrl, sessionId }: CodeWorkspaceProps) {
  // Fallback to local sandbox hook if not provided
  const localSandbox = useSandbox();
  const activeSandbox = sandbox || localSandbox;
  const { code, setCode, status, stdout, stderr, run, client } = activeSandbox;

  const handleRun = useCallback(async () => {
    // Sync the code to /src/index.js first
    await client.syncFile('/src/index.js', code);

    // Run the code
    await run();

    // Get fresh snapshot from sandbox client
    const activeSessionId = sessionId || 'local-preview';
    const turnId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 't-' + Math.random().toString(36).substring(2, 9);
    
    const snapshot = client.snapshot({
      sessionId: activeSessionId,
      turnId,
      maxChars: 4000,
    });

    if (apiBaseUrl) {
      postSessionEvent(apiBaseUrl, {
        sessionId: activeSessionId,
        turnId,
        kind: 'sandbox.run',
        payload: {
          activeFilePath: '/src/index.js',
          status: snapshot.status,
          stdoutTail: snapshot.stdoutTail || '',
          stderrTail: snapshot.stderrTail || '',
        },
        createdAt: new Date().toISOString(),
      }).catch((err) => {
        console.error('Failed to post sandbox.run event:', err);
      });
    }
  }, [run, client, code, apiBaseUrl, sessionId]);

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 bg-slate-900 text-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center pb-2 border-b border-slate-700">
        <h2 className="text-xl font-bold font-mono tracking-tight text-teal-400">Code Workspace</h2>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
            Status: <span className={`font-semibold ${status === 'running' ? 'text-yellow-400' : status === 'completed' ? 'text-green-400' : status === 'failed' ? 'text-red-400' : 'text-slate-400'}`}>{status}</span>
          </span>
          <button
            onClick={handleRun}
            disabled={status === 'running'}
            className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-700 text-slate-950 font-semibold font-mono rounded text-sm transition-colors shadow"
          >
            {status === 'running' ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-mono text-slate-400">/src/index.js</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={status === 'running'}
            className="flex-1 p-3 bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded font-mono text-sm resize-none h-full text-emerald-400 leading-relaxed"
          />
        </div>

        <div className="flex flex-col gap-2 h-full">
          <span className="text-sm font-mono text-slate-400">Terminal Output</span>
          <div className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded font-mono text-sm overflow-auto h-full max-h-[380px]">
            {stdout && (
              <pre className="text-green-400 whitespace-pre-wrap leading-relaxed">{stdout}</pre>
            )}
            {stderr && (
              <pre className="text-red-400 whitespace-pre-wrap leading-relaxed">{stderr}</pre>
            )}
            {!stdout && !stderr && (
              <span className="text-slate-600 italic">No output yet. Click 'Run Code' above.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

