import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useVoiceRoom } from './useVoiceRoom';

// Mock livekit-client Room
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSetMicrophoneEnabled = vi.fn();

vi.mock('livekit-client', () => {
  return {
    Room: vi.fn().mockImplementation(function () {
      return {
        connect: mockConnect,
        disconnect: mockDisconnect,
        on: vi.fn(),
        off: vi.fn(),
        localParticipant: {
          setMicrophoneEnabled: mockSetMicrophoneEnabled,
        },
      };
    }),
    RoomEvent: {
      TrackSubscribed: 'trackSubscribed',
      TrackUnsubscribed: 'trackUnsubscribed',
    },
    Track: {
      Kind: {
        Audio: 'audio',
      },
    },
  };
});

vi.mock('../lib/api', () => ({
  fetchLiveKitToken: vi.fn().mockResolvedValue({
    wsUrl: 'ws://mock-livekit',
    token: 'mock-token',
  }),
}));

const mockRefObj = { current: false };

// Mock React
vi.mock('react', () => {
  let statusVal = 'idle';
  let errorVal: string | null = null;
  const setStatus = vi.fn().mockImplementation((val) => {
    statusVal = val;
  });
  const setError = vi.fn().mockImplementation((val) => {
    errorVal = val;
  });

  return {
    useState: (init: any) => {
      if (init === 'idle') {
        return [statusVal, setStatus];
      }
      return [errorVal, setError];
    },
    useMemo: (factory: any) => factory(),
    useEffect: (callback: any) => {
      // do nothing or return cleanup
    },
    useRef: (init: any) => {
      mockRefObj.current = mockRefObj.current ?? init;
      return mockRefObj;
    },
  };
});

describe('useVoiceRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockReset();
    mockDisconnect.mockReset();
    mockSetMicrophoneEnabled.mockReset();
    mockRefObj.current = false;
  });

  it('disconnects if room.connect succeeds but setMicrophoneEnabled fails', async () => {
    mockConnect.mockResolvedValue(undefined);
    mockSetMicrophoneEnabled.mockRejectedValue(new Error('Mic permission denied'));

    const { connect } = useVoiceRoom({
      apiBaseUrl: 'http://localhost',
      roomName: 'room-1',
      identity: 'user-1',
    });

    await connect();

    expect(mockConnect).toHaveBeenCalled();
    expect(mockSetMicrophoneEnabled).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled(); // should disconnect because mic failed
  });

  it('does not disconnect if room.connect itself fails', async () => {
    mockConnect.mockRejectedValue(new Error('Connection failed'));

    const { connect } = useVoiceRoom({
      apiBaseUrl: 'http://localhost',
      roomName: 'room-1',
      identity: 'user-1',
    });

    await connect();

    expect(mockConnect).toHaveBeenCalled();
    expect(mockSetMicrophoneEnabled).not.toHaveBeenCalled();
    expect(mockDisconnect).not.toHaveBeenCalled(); // should not disconnect because connection failed
  });
});
