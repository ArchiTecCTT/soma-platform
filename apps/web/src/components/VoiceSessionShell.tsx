import React, { useMemo } from 'react';
import { useVoiceRoom } from '../hooks/useVoiceRoom';

interface VoiceSessionShellProps {
  apiBaseUrl: string;
}

export function VoiceSessionShell({ apiBaseUrl }: VoiceSessionShellProps) {
  const roomName = 'soma-mvp';
  // Stable identity for the lifetime of this component instance
  const identity = useMemo(() => `user-${crypto.randomUUID()}`, []);

  const { status, error, connect, disconnect } = useVoiceRoom({
    apiBaseUrl,
    roomName,
    identity,
  });

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
    </div>
  );
}
