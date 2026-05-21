import React, { useMemo, useEffect, useRef } from 'react';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { CodeWorkspace } from './CodeWorkspace';
import { useSandbox } from '../hooks/useSandbox';
import { registerSandboxRpc } from '../livekit/registerSandboxRpc';
import { postSessionEvent } from '../lib/events';

interface VoiceSessionShellProps {
  apiBaseUrl: string;
}

export function VoiceSessionShell({ apiBaseUrl }: VoiceSessionShellProps) {
  const roomName = 'soma-mvp-demo';
  const identity = useMemo(() => `user-${crypto.randomUUID()}`, []);
  const sandbox = useSandbox();

  const { room, status, error, connect, disconnect } = useVoiceRoom({
    apiBaseUrl,
    roomName,
    identity,
  });

  const hasRegisteredRef = useRef<{ identity: string; roomName: string } | null>(null);

  useEffect(() => {
    if (status !== 'connected') {
      hasRegisteredRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    if (status === 'connected' && room) {
      if (
        hasRegisteredRef.current &&
        hasRegisteredRef.current.identity === identity &&
        hasRegisteredRef.current.roomName === roomName
      ) {
        return;
      }

      hasRegisteredRef.current = { identity, roomName };
      registerSandboxRpc(room, sandbox.client);

      postSessionEvent(apiBaseUrl, {
        sessionId: roomName,
        kind: 'session.lifecycle',
        payload: { action: 'joined', identity },
        createdAt: new Date().toISOString(),
      }).catch((err) => {
        console.error('Failed to post session lifecycle joined event:', err);
      });
    }
  }, [status, room, sandbox.client, apiBaseUrl, identity, roomName]);

  const statusColor =
    status === 'connected' ? '#34d399' : status === 'connecting' ? '#fbbf24' : status === 'error' ? '#fb7185' : '#64748b';

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e2e8f0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            padding: '18px 20px',
            marginBottom: 24,
            border: '1px solid #1e293b',
            borderRadius: 16,
            background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
            boxShadow: '0 20px 50px rgba(0,0,0,.35)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="mono" style={{ color: '#2dd4bf', fontSize: 34, fontWeight: 800, letterSpacing: 1 }}>
              SOMA PLATFORM
            </div>
            <div className="mono" style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
              MVP-1 // ADVERSARIAL LEARNING ENVIRONMENT
            </div>
          </div>
          <button
            onClick={status === 'connected' ? disconnect : connect}
            disabled={status === 'connecting'}
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              border: '1px solid ' + (status === 'connected' ? '#7f1d1d' : '#134e4a'),
              background: status === 'connected' ? '#3f0d17' : '#14b8a6',
              color: status === 'connected' ? '#fecdd3' : '#042f2e',
              cursor: status === 'connecting' ? 'not-allowed' : 'pointer',
              fontWeight: 700,
            }}
          >
            {status === 'connected' ? 'Disconnect' : status === 'connecting' ? 'Connecting...' : 'Join Voice Session'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 24 }}>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 20 }}>
              <div className="mono" style={{ fontWeight: 800, color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
                SESSION PROFILE
              </div>
              <div style={{ display: 'grid', gap: 14, fontSize: 14 }}>
                <div>
                  <div className="mono" style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>ACTIVE ROOM</div>
                  <div className="mono" style={{ color: '#2dd4bf' }}>{roomName}</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>SESSION ID</div>
                  <div className="mono" style={{ color: '#2dd4bf', wordBreak: 'break-all', background: '#020617', border: '1px solid #1e293b', borderRadius: 10, padding: 10 }}>
                    {roomName}
                  </div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>PARTICIPANT ID</div>
                  <div className="mono" style={{ color: '#cbd5e1', wordBreak: 'break-all', background: '#020617', border: '1px solid #1e293b', borderRadius: 10, padding: 10 }}>
                    {identity}
                  </div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>SIGNAL STATUS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: statusColor, display: 'inline-block' }} />
                    <span className="mono" style={{ textTransform: 'uppercase', fontWeight: 700 }}>{status}</span>
                  </div>
                </div>
              </div>
              {error && (
                <div className="mono" style={{ marginTop: 16, padding: 12, borderRadius: 10, background: '#3f0d17', border: '1px solid #7f1d1d', color: '#fecdd3', fontSize: 12 }}>
                  {error}
                </div>
              )}
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 20 }}>
              <div className="mono" style={{ fontWeight: 800, color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
                LEARNING MISSION
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, color: '#cbd5e1', lineHeight: 1.7 }}>
                <li>Change code to subtraction: <span className="mono" style={{ color: '#34d399' }}>return a - b;</span></li>
                <li>Press <strong>Run Code</strong> and confirm terminal shows <span className="mono" style={{ color: '#34d399' }}>-1</span>.</li>
                <li>Press <strong>Join Voice Session</strong>.</li>
                <li>Make sure the <strong>agent service</strong> is running locally.</li>
                <li>Then say: <em>“My add function is correct.”</em></li>
              </ol>
              <div className="mono" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1e293b', fontSize: 11, color: '#64748b' }}>
                RAMS AGENTIC MENTOR SYSTEM // AZURE GPT-REALTIME
              </div>
            </div>
          </div>

          <section>
            <CodeWorkspace sandbox={sandbox} apiBaseUrl={apiBaseUrl} sessionId={roomName} />
          </section>
        </div>
      </div>
    </div>
  );
}
