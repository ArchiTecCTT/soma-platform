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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-ping"></span>
            <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent font-mono">
              SOMA PLATFORM
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">MVP-1 // ADVERSARIAL LEARNING ENVIRONMENT</p>
        </div>

        <div className="flex items-center gap-3">
          {status === 'connected' ? (
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-400 border border-rose-500/20 rounded font-mono text-sm font-semibold transition-all shadow-lg shadow-rose-950/20 flex items-center gap-2 cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-rose-400"></span>
              Disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={status === 'connecting'}
              className="px-5 py-2 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 active:bg-teal-600 text-slate-950 disabled:text-slate-500 border border-teal-500/20 rounded font-mono text-sm font-bold transition-all shadow-lg shadow-teal-500/10 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {status === 'connecting' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
                  Connecting...
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-teal-900"></span>
                  Join Voice Session
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Status & Control */}
        <section className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xl">
            <h2 className="text-sm font-bold font-mono tracking-widest text-slate-400 uppercase mb-4 border-b border-slate-800 pb-2">
              Session Profile
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-xs font-mono text-slate-500 uppercase">Active Room</span>
                <span className="font-mono text-teal-400 font-bold">{roomName}</span>
              </div>
              <div>
                <span className="block text-xs font-mono text-slate-500 uppercase">Participant ID</span>
                <span className="font-mono text-slate-300 break-all select-all text-xs bg-slate-950 p-2 rounded block border border-slate-800/50 mt-1">
                  {identity}
                </span>
              </div>
              <div>
                <span className="block text-xs font-mono text-slate-500 uppercase">Signal Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      status === 'connected'
                        ? 'bg-emerald-400 animate-pulse'
                        : status === 'connecting'
                        ? 'bg-yellow-400 animate-pulse'
                        : status === 'error'
                        ? 'bg-rose-500'
                        : 'bg-slate-600'
                    }`}
                  ></span>
                  <span className="font-mono text-xs uppercase font-bold tracking-wider">
                    {status}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-5 p-3.5 bg-rose-950/20 border border-rose-500/20 rounded text-rose-400 text-xs font-mono">
                <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  ⚠️ Signal Error
                </div>
                {error}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold font-mono tracking-widest text-slate-400 uppercase mb-4 border-b border-slate-800 pb-2">
                Learning Mission
              </h2>
              <ul className="space-y-3.5 text-xs text-slate-400 font-mono leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-0.5">▶</span>
                  <span>Change the code in the workspace to return subtraction (e.g. <code className="text-emerald-400">a - b</code>).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-0.5">▶</span>
                  <span>Click <strong className="text-slate-200">Run Code</strong> and confirm terminal output shows buggy <code className="text-emerald-400">-1</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-0.5">▶</span>
                  <span>Click <strong className="text-slate-200">Join Voice Session</strong> to summon RAMS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-0.5">▶</span>
                  <span>Unmute and boast: <em className="text-slate-200">"My add function is correct!"</em></span>
                </li>
              </ul>
            </div>
            
            <div className="border-t border-slate-800 pt-4 mt-6 text-[10px] text-slate-600 font-mono">
              RAMS AGENTIC MENTOR SYSTEM v1.0 // POWERED BY AZURE GPT-REALTIME
            </div>
          </div>
        </section>

        {/* Code & Terminal Workspace Area */}
        <section className="lg:col-span-2">
          <CodeWorkspace sandbox={sandbox} apiBaseUrl={apiBaseUrl} sessionId={roomName} />
        </section>
      </main>
    </div>
  );
}


