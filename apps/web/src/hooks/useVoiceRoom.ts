import { useMemo, useState, useEffect } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { fetchLiveKitToken } from '../lib/api';

export type RoomConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface UseVoiceRoomOptions {
  apiBaseUrl: string;
  roomName: string;
  identity: string;
}

export function useVoiceRoom({ apiBaseUrl, roomName, identity }: UseVoiceRoomOptions) {
  const [status, setStatus] = useState<RoomConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Memoize Room instance to ensure we only have one
  const room = useMemo(() => {
    return new Room({
      adaptiveStream: true,
      dynacast: true,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      room.disconnect();
    };
  }, [room]);

  const connect = async () => {
    if (status === 'connecting' || status === 'connected') return;

    setStatus('connecting');
    setError(null);

    try {
      const { wsUrl, token } = await fetchLiveKitToken(apiBaseUrl, roomName, identity);
      await room.connect(wsUrl, token);
      setStatus('connected');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  const disconnect = async () => {
    try {
      await room.disconnect();
    } catch (err) {
      // Ignore disconnect errors
    } finally {
      setStatus('idle');
    }
  };

  return {
    room,
    status,
    error,
    connect,
    disconnect,
  };
}
