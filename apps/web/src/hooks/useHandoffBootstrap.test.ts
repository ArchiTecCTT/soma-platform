import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useHandoffBootstrap } from './useHandoffBootstrap';
import * as handoffModule from '../lib/handoff';

vi.mock('../lib/handoff', () => ({
  bootstrapSession: vi.fn(),
}));

// Mock React useEffect and useState since we are testing inside standard Node environment
vi.mock('react', () => {
  let stateVal: any = null;
  const setVal = vi.fn().mockImplementation((newVal) => {
    if (typeof newVal === 'function') {
      stateVal = newVal(stateVal);
    } else {
      stateVal = newVal;
    }
  });

  return {
    useState: (init: any) => {
      stateVal = stateVal ?? init;
      return [stateVal, setVal];
    },
    useEffect: (callback: any) => {
      callback();
    },
  };
});

describe('useHandoffBootstrap', () => {
  const originalWindow = (globalThis as any).window;
  const originalDocument = (globalThis as any).document;

  beforeEach(() => {
    vi.restoreAllMocks();
    
    // Mock globalThis.window & globalThis.document
    (globalThis as any).window = {
      location: {
        href: 'http://localhost:3000/?handoff=test-token&otherParam=123#my-hash',
        pathname: '/',
        search: '?handoff=test-token&otherParam=123',
        hash: '#my-hash',
      },
      history: {
        replaceState: vi.fn(),
      },
    };

    (globalThis as any).document = {
      title: 'Mock Document',
    };
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
  });

  it('performs bootstrap, updates URL while preserving other params and hash', async () => {
    const mockData = {
      topic: 'Rust',
      curriculum: [],
      socraticQuestion: '?',
      roomName: 'room-1',
      participantName: 'p-1',
      livekit: { url: 'ws://', token: 'tok' },
    };

    const bootstrapSpy = vi.spyOn(handoffModule, 'bootstrapSession').mockResolvedValue(mockData);

    useHandoffBootstrap('http://api-base');

    expect(bootstrapSpy).toHaveBeenCalledWith('http://api-base', 'test-token');
    
    // Wait for async bootstrapSession to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Check cleanUrl replaced correctly in window.history.replaceState
    expect((globalThis as any).window.history.replaceState).toHaveBeenCalledWith(
      {},
      'Mock Document',
      '/?otherParam=123#my-hash'
    );
  });
});
