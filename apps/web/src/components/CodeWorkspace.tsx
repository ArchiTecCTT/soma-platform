import React, { useCallback } from 'react';
import { useSandbox } from '../hooks/useSandbox';
import { postSessionEvent } from '../lib/events';

interface CodeWorkspaceProps {
  sandbox?: ReturnType<typeof useSandbox>;
  apiBaseUrl?: string;
  sessionId?: string;
}

function stripAnsi(str: string): string {
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

export function CodeWorkspace({ sandbox, apiBaseUrl, sessionId }: CodeWorkspaceProps) {
  const localSandbox = useSandbox();
  const activeSandbox = sandbox || localSandbox;
  const { code, setCode, status, stdout, stderr, run, client } = activeSandbox;

  const handleRun = useCallback(async () => {
    await run();

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
          command: snapshot.lastCommand,
          status: snapshot.status,
          stdoutTail: snapshot.stdoutTail || '',
          stderrTail: snapshot.stderrTail || '',
        },
        createdAt: new Date().toISOString(),
      }).catch((err) => {
        console.error('Failed to post sandbox.run event:', err);
      });
    }
  }, [run, client, apiBaseUrl, sessionId]);

  const statusColor = status === 'running' ? '#fbbf24' : status === 'completed' ? '#34d399' : status === 'failed' ? '#fb7185' : '#94a3b8';

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 20, boxShadow: '0 20px 50px rgba(0,0,0,.35)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #1e293b', flexWrap: 'wrap' }}>
        <h2 className="mono" style={{ margin: 0, color: '#2dd4bf', fontSize: 22 }}>CODE WORKSPACE</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="mono" style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 999, padding: '8px 12px', fontSize: 12 }}>
            Status: <span style={{ color: statusColor, fontWeight: 700 }}>{status}</span>
          </div>
          <button
            onClick={handleRun}
            disabled={status === 'running'}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              border: '1px solid #134e4a',
              background: status === 'running' ? '#334155' : '#14b8a6',
              color: status === 'running' ? '#94a3b8' : '#042f2e',
              cursor: status === 'running' ? 'not-allowed' : 'pointer',
              fontWeight: 700,
            }}
          >
            {status === 'running' ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 460 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="mono" style={{ fontSize: 12, color: '#94a3b8' }}>/src/index.js</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={status === 'running'}
            style={{
              flex: 1,
              minHeight: 420,
              width: '100%',
              padding: 16,
              borderRadius: 12,
              border: '1px solid #1e293b',
              outline: 'none',
              resize: 'none',
              background: '#020617',
              color: '#86efac',
              lineHeight: 1.6,
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="mono" style={{ fontSize: 12, color: '#94a3b8' }}>TERMINAL OUTPUT</span>
          <div style={{ flex: 1, minHeight: 420, padding: 16, borderRadius: 12, border: '1px solid #1e293b', background: '#020617', overflow: 'auto' }}>
            {stdout ? <pre style={{ margin: 0, color: '#4ade80', whiteSpace: 'pre-wrap' }}>{stripAnsi(stdout)}</pre> : null}
            {stderr ? <pre style={{ margin: stdout ? '12px 0 0' : 0, color: '#fb7185', whiteSpace: 'pre-wrap' }}>{stripAnsi(stderr)}</pre> : null}
            {!stdout && !stderr ? <span style={{ color: '#64748b', fontStyle: 'italic' }}>No output yet. Click Run Code.</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
