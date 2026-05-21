import { useMemo, useState, useEffect } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
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

  useEffect(() => {
    const attachedElements: HTMLElement[] = [];

    const handleTrackSubscribed = (track: any) => {
      if (track.kind !== Track.Kind.Audio) return;
      const element = track.attach();
      element.autoplay = true;
      if ('playsInline' in element) {
        (element as any).playsInline = true;
      }
      element.style.display = 'none';
      document.body.appendChild(element);
      attachedElements.push(element);
      void (element as HTMLMediaElement).play?.().catch(() => {});
    };

    const handleTrackUnsubscribed = (track: any) => {
      if (track.kind !== Track.Kind.Audio) return;
      track.detach().forEach((el: Element) => el.remove());
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      attachedElements.forEach((el) => el.remove());
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
      await room.localParticipant.setMicrophoneEnabled(true);
      setStatus('connected');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  const disconnect = async () => {
    try {
      await room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
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
