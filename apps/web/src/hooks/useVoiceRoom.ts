import { useMemo, useState, useEffect, useRef } from 'react';
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
  const isConnectingRef = useRef(false);

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

  const connect = async (overrideLiveKit?: { url: string; token: string }) => {
    if (isConnectingRef.current || status === 'connecting' || status === 'connected') return;

    isConnectingRef.current = true;
    setStatus('connecting');
    setError(null);

    let didConnectRoom = false;

    try {
      let wsUrl: string;
      let token: string;

      if (overrideLiveKit) {
        wsUrl = overrideLiveKit.url;
        token = overrideLiveKit.token;
      } else {
        const res = await fetchLiveKitToken(apiBaseUrl, roomName, identity);
        wsUrl = res.wsUrl;
        token = res.token;
      }

      await room.connect(wsUrl, token);
      didConnectRoom = true;

      await room.localParticipant.setMicrophoneEnabled(true);
      setStatus('connected');
    } catch (err: any) {
      if (didConnectRoom) {
        try {
          await room.disconnect();
        } catch (discErr) {
          // ignore disconnect error
        }
      }
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    } finally {
      isConnectingRef.current = false;
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
