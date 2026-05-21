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
  // Stable identity for the lifetime of this component instance
  const identity = useMemo(() => `user-${crypto.randomUUID()}`, []);

  const sandbox = useSandbox();

  const { room, status, error, connect, disconnect } = useVoiceRoom({
    apiBaseUrl,
    roomName,
    identity,
  });

  // Keep track of the active connection identity/session we have registered and posted a joined event for.
  const hasRegisteredRef = useRef<{ identity: string; roomName: string } | null>(null);

  // Reset the registration guard if we disconnect or become idle
  useEffect(() => {
    if (status !== 'connected') {
      hasRegisteredRef.current = null;
    }
  }, [status]);

  // Automatically register RPC when room gets connected, and post lifecycle event
  useEffect(() => {
    if (status === 'connected' && room) {
      // Check if we have already registered for this active connection identity and session/room
      if (
        hasRegisteredRef.current &&
        hasRegisteredRef.current.identity === identity &&
        hasRegisteredRef.current.roomName === roomName
      ) {
        return;
      }

      // Mark as registered/joined before doing async tasks to prevent race conditions or duplicates
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

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Soma Voice Shell</h1>
      <div style={{ margin: '1rem 0' }}>
        <strong>Room:</strong> {roomName}
      </div>
      <div style={{ margin: '1rem 0' }}>
        <strong>Identity:</strong> {identity}
      </div>
      <div style={{ margin: '1rem 0' }}>
        <strong>Status:</strong>{' '}
        <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{status}</span>
      </div>

      {error && (
        <div style={{ color: 'red', margin: '1rem 0', border: '1px solid red', padding: '0.5rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ margin: '1rem 0' }}>
        {status === 'connected' ? (
          <button onClick={disconnect} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Leave Room
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={status === 'connecting'}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            {status === 'connecting' ? 'Connecting...' : 'Join Room'}
          </button>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <CodeWorkspace sandbox={sandbox} apiBaseUrl={apiBaseUrl} sessionId={roomName} />
      </div>
    </div>
  );
}


