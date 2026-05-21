# Soma MVP-1 Chunk 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the browser WebContainer sandbox, expose bounded sandbox snapshots, and bridge the browser and agent over LiveKit Room RPC so RAMS can inspect live code state.

**Architecture:** Initialize and run WebContainer directly on the main thread inside a helper client class. The React hook instantiates and communicates with this main-thread SandboxClient. The browser registers `read_sandbox_state` on `room.localParticipant.registerRpcMethod`, and the agent invokes it via `performRpc` before critiquing code.

**Tech Stack:** React, WebContainer API, LiveKit Room RPC, TypeScript, Vitest.

---

### Task 1: Build the browser sandbox client and hook

**Files:**
- Create: `apps/web/src/sandbox/client.ts`
- Create: `apps/web/src/hooks/useSandbox.ts`
- Create: `apps/web/src/components/CodeWorkspace.tsx`
- Create: `apps/web/src/sandbox/client.test.ts`

- [ ] **Step 1: Write the failing sandbox client test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { SandboxClient } from './client';

// Mock WebContainer
vi.mock('@webcontainer/api', () => {
  return {
    WebContainer: {
      boot: vi.fn().mockResolvedValue({
        fs: {
          mkdir: vi.fn().mockResolvedValue(undefined),
          writeFile: vi.fn().mockResolvedValue(undefined),
        },
        spawn: vi.fn().mockResolvedValue({
          output: {
            pipeTo: vi.fn().mockImplementation((stream) => {
              const writer = stream.getWriter();
              writer.write('1');
              writer.releaseLock();
              return Promise.resolve();
            }),
          },
          exit: Promise.resolve(0),
        }),
      }),
    },
  };
});

describe('SandboxClient', () => {
  it('resolves snapshots directly from the main thread state', async () => {
    const client = new SandboxClient();
    await client.init();
    await client.syncFile('/src/index.js', 'console.log(1);');
    await client.runEntry('/src/index.js');

    const result = await client.snapshot({ sessionId: 's-1', turnId: 't-1', maxChars: 4000 });

    expect(result.activeFilePath).toBe('/src/index.js');
    expect(result.stdoutTail).toBe('1');
  });
});
```

- [ ] **Step 2: Run the web tests to verify they fail**

Run: `pnpm --filter @soma/web test`
Expected: FAIL with module-not-found for `./client`

- [ ] **Step 3: Implement the browser sandbox client and hook**

```ts
// apps/web/src/sandbox/client.ts
import { WebContainer } from '@webcontainer/api';
import { SandboxStateSchema, type ReadSandboxStateRequest, type SandboxState } from '@soma/shared';

export class SandboxClient {
  private webcontainer: WebContainer | null = null;
  private files = new Map<string, string>([['/src/index.js', 'export function add(a, b) { return a + b; }']]);
  private stdoutTail = '';
  private stderrTail = '';
  private lastCommand: string | null = null;
  private exitCode: number | null = null;
  private status: 'idle' | 'running' | 'completed' | 'error' = 'idle';

  async init() {
    if (!this.webcontainer) {
      this.webcontainer = await WebContainer.boot();
      await this.webcontainer.fs.mkdir('/src', { recursive: true });
      await this.syncFiles();
    }
  }

  async syncFile(path: string, content: string) {
    this.files.set(path, content);
    if (this.webcontainer) {
      await this.webcontainer.fs.writeFile(path, content);
    }
  }

  private async syncFiles() {
    if (!this.webcontainer) return;
    for (const [path, content] of this.files) {
      await this.webcontainer.fs.writeFile(path, content);
    }
  }

  async runEntry(entryPath: string) {
    await this.init();
    await this.syncFiles();
    this.status = 'running';
    this.lastCommand = `node ${entryPath}`;
    this.stdoutTail = '';
    this.stderrTail = '';

    const process = await this.webcontainer!.spawn('node', [entryPath]);
    process.output.pipeTo(
      new WritableStream({
        write: (chunk) => {
          this.stdoutTail = `${this.stdoutTail}${chunk}`;
        },
      }),
    );
    this.exitCode = await process.exit;
    this.status = this.exitCode === 0 ? 'completed' : 'error';
    return { exitCode: this.exitCode };
  }

  async snapshot(request: ReadSandboxStateRequest): Promise<SandboxState> {
    // RPC payload constraint: LiveKit Room RPC has a strict 15 KB size limit.
    // To respect this ceiling, we restrict the files array and truncate file contents and stdout/stderr tails.
    const maxChars = Math.min(request.maxChars, 4000); // Bounded to prevent flooding the RPC channel

    const processedFiles = Array.from(this.files.entries()).map(([path, content]) => {
      // Truncate file content to stay well within the 15 KB limit
      const maxFileContentLen = 2000;
      const truncatedContent = content.length > maxFileContentLen 
        ? content.slice(0, maxFileContentLen) + '\n... [truncated]' 
        : content;
      return { path, content: truncatedContent };
    }).slice(0, 5); // Bounded to maximum 5 files

    const response: SandboxState = {
      sessionId: request.sessionId,
      turnId: request.turnId,
      activeFilePath: '/src/index.js',
      files: processedFiles,
      stdoutTail: this.stdoutTail.length > maxChars 
        ? '... [truncated]\n' + this.stdoutTail.slice(-maxChars) 
        : this.stdoutTail,
      stderrTail: this.stderrTail.length > maxChars 
        ? '... [truncated]\n' + this.stderrTail.slice(-maxChars) 
        : this.stderrTail,
      lastCommand: this.lastCommand,
      exitCode: this.exitCode,
      status: this.status,
      capturedAt: new Date().toISOString(),
    };

    return SandboxStateSchema.parse(response);
  }
}
```

```ts
// apps/web/src/hooks/useSandbox.ts
import { useEffect, useMemo, useState } from 'react';
import { SandboxClient } from '../sandbox/client';

export function useSandbox() {
  const client = useMemo(() => new SandboxClient(), []);
  const [code, setCode] = useState('export function add(a, b) {\n  return a + b;\n}\n\nconsole.log(add(2, 3));\n');
  const [stdout, setStdout] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');

  useEffect(() => {
    void client.init();
  }, [client]);

  async function syncActiveFile(nextCode: string) {
    setCode(nextCode);
    await client.syncFile('/src/index.js', nextCode);
  }

  async function run() {
    setStatus('running');
    await client.syncFile('/src/index.js', code);
    await client.runEntry('/src/index.js');
    const snapshot = await client.snapshot({ sessionId: 'local-preview', turnId: crypto.randomUUID(), maxChars: 4000 });
    setStdout(snapshot.stdoutTail);
    setStatus(snapshot.status);
  }

  return { client, code, stdout, status, syncActiveFile, run };
}
```

```tsx
// apps/web/src/components/CodeWorkspace.tsx
import { useSandbox } from '../hooks/useSandbox';

export function CodeWorkspace() {
  const { code, stdout, status, syncActiveFile, run } = useSandbox();

  return (
    <section>
      <h2>Workspace</h2>
      <textarea value={code} onChange={(event) => void syncActiveFile(event.target.value)} rows={18} cols={80} />
      <div>
        <button onClick={() => void run()}>Run code</button>
        <span> Sandbox status: {status}</span>
      </div>
      <pre>{stdout}</pre>
    </section>
  );
}
```

- [ ] **Step 4: Run focused sandbox verification**

Run: `pnpm --filter @soma/web test && pnpm --filter @soma/web check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/sandbox apps/web/src/hooks/useSandbox.ts apps/web/src/components/CodeWorkspace.tsx
git commit -m "feat: add browser sandbox client"
```

### Task 2: Register browser RPC methods and create the agent-side RPC requester

**Files:**
- Create: `apps/web/src/livekit/registerSandboxRpc.ts`
- Create: `packages/shared/src/contracts/turns.ts`
- Modify: `packages/shared/src/index.ts`
- Create: `apps/agent/src/rpc/requestSandboxState.ts`
- Create: `apps/agent/src/rpc/requestSandboxState.test.ts`
- Modify: `apps/web/src/components/VoiceSessionShell.tsx`
- Modify: `apps/web/src/hooks/useVoiceRoom.ts`

- [ ] **Step 1: Write the failing RPC helper test**

```ts
import { describe, expect, it } from 'vitest';
import { isStaleSandboxState } from './requestSandboxState';

describe('isStaleSandboxState', () => {
  it('detects stale sandbox responses by turnId mismatch', () => {
    expect(isStaleSandboxState('t-2', { turnId: 't-1' } as { turnId: string })).toBe(true);
    expect(isStaleSandboxState('t-2', { turnId: 't-2' } as { turnId: string })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the agent tests to verify they fail**

Run: `pnpm --filter @soma/agent test`
Expected: FAIL with module-not-found for `./requestSandboxState`

- [ ] **Step 3: Implement turn IDs, browser RPC registration, and agent RPC requester**

```ts
export function createTurnId() {
  return `turn-${crypto.randomUUID()}`;
}
```

```ts
export * from './contracts/env';
export * from './contracts/rpc';
export * from './contracts/events';
export * from './contracts/turns';
```

```ts
import { ReadSandboxStateRequestSchema } from '@soma/shared';
import type { Room } from 'livekit-client';
import type { SandboxClient } from '../sandbox/client';

export function registerSandboxRpc(room: Room, sandbox: SandboxClient) {
  room.localParticipant.registerRpcMethod('read_sandbox_state', async (invocation) => {
    const request = ReadSandboxStateRequestSchema.parse(JSON.parse(invocation.payload));
    const snapshot = await sandbox.snapshot(request);
    return JSON.stringify(snapshot);
  });
}
```

```ts
import { ReadSandboxStateRequestSchema, SandboxStateSchema, type ReadSandboxStateRequest } from '@soma/shared';
import type { JobContext, RemoteParticipant } from '@livekit/agents';

export function isStaleSandboxState(expectedTurnId: string, snapshot: { turnId: string }) {
  return snapshot.turnId !== expectedTurnId;
}

export async function requestSandboxState(
  ctx: JobContext,
  participant: RemoteParticipant,
  request: ReadSandboxStateRequest,
) {
  const payload = ReadSandboxStateRequestSchema.parse(request);

  const response = await ctx.room.localParticipant.performRpc({
    destinationIdentity: participant.identity,
    method: 'read_sandbox_state',
    payload: JSON.stringify(payload),
  });

  const snapshot = SandboxStateSchema.parse(JSON.parse(response));
  if (isStaleSandboxState(payload.turnId, snapshot)) {
    throw new Error(`Stale sandbox state for turn ${payload.turnId}`);
  }

  return snapshot;
}
```

```tsx
import { CodeWorkspace } from './CodeWorkspace';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { useSandbox } from '../hooks/useSandbox';
import { registerSandboxRpc } from '../livekit/registerSandboxRpc';

export function VoiceSessionShell({ apiBaseUrl }: { apiBaseUrl: string }) {
  const sandbox = useSandbox();
  const { room, status, error, connect, disconnect } = useVoiceRoom(apiBaseUrl);

  async function handleJoin() {
    await connect('soma-mvp', `user-${crypto.randomUUID()}`);
    registerSandboxRpc(room, sandbox.client);
  }

  return (
    <section>
      <h1>Soma MVP-1</h1>
      <p>Status: {status}</p>
      {error ? <p role="alert">{error}</p> : null}
      {status === 'connected' ? (
        <button onClick={() => void disconnect()}>Leave session</button>
      ) : (
        <button onClick={() => void handleJoin()}>Join session</button>
      )}
      <CodeWorkspace />
    </section>
  );
}
```

- [ ] **Step 4: Run focused RPC verification**

Run: `pnpm --filter @soma/agent test && pnpm --filter @soma/web check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/livekit apps/agent/src/rpc packages/shared/src/contracts/turns.ts packages/shared/src/index.ts
git commit -m "feat: connect sandbox rpc bridge"
```

### Task 3: Wire the sandbox inspection tool into RAMS

**Files:**
- Create: `apps/agent/src/tools/readSandboxStateTool.ts`
- Modify: `apps/agent/src/index.ts`
- Modify: `apps/agent/src/rams/systemPrompt.ts`

- [ ] **Step 1: Write the failing tool test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createReadSandboxStateTool } from './readSandboxStateTool';

describe('createReadSandboxStateTool', () => {
  it('delegates to the requester and returns the bounded snapshot', async () => {
    const requestSandboxState = vi.fn().mockResolvedValue({
      sessionId: 's-1',
      turnId: 't-1',
      activeFilePath: '/src/index.js',
      files: [{ path: '/src/index.js', content: 'console.log(1);' }],
      stdoutTail: '1',
      stderrTail: '',
      lastCommand: 'node /src/index.js',
      exitCode: 0,
      status: 'completed',
      capturedAt: '2026-05-21T00:00:00.000Z',
    });

    const tool = createReadSandboxStateTool(requestSandboxState as never);
    const result = await tool.execute({ sessionId: 's-1', turnId: 't-1', maxChars: 4000 }, { ctx: {} as never });

    expect(requestSandboxState).toHaveBeenCalled();
    expect(result.stdoutTail).toBe('1');
  });
});
```

- [ ] **Step 2: Run the agent tests to verify they fail**

Run: `pnpm --filter @soma/agent test`
Expected: FAIL with module-not-found for `./readSandboxStateTool`

- [ ] **Step 3: Implement the tool and update the RAMS rules**

```ts
import { llm } from '@livekit/agents';
import { z } from 'zod';

const params = z.object({
  sessionId: z.string().min(1),
  turnId: z.string().min(1),
  maxChars: z.number().int().positive().max(8000).default(4000),
});

export function createReadSandboxStateTool(
  requestSandboxState: (args: z.infer<typeof params>, extra: { ctx: unknown }) => Promise<unknown>,
) {
  return llm.tool({
    description: 'Read the current browser sandbox state before critiquing code or execution claims.',
    parameters: params,
    execute: requestSandboxState,
  });
}
```

```ts
export const RAMS_SYSTEM_PROMPT = [
  'You are RAMS, an adversarial technical mentor.',
  'Do not flatter the user or offer empty reassurance.',
  'Ask the user to explain their reasoning before accepting a claim.',
  'Before critiquing code, prefer evidence from the sandbox state and actual runtime output.',
  'If the user makes a concrete code claim, inspect the sandbox before agreeing.',
  'Challenge false premises directly and briefly.',
  'Keep answers short, concrete, and technically precise.',
].join(' ');
```

```ts
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { cli, defineAgent, voice, WorkerOptions, type JobContext, type RemoteParticipant } from '@livekit/agents';
import { createTurnId } from '@soma/shared';
import { parseAgentEnv } from './env';
import { createAzureRealtimeModel } from './realtime/createAzureRealtimeModel';
import { RAMS_SYSTEM_PROMPT } from './rams/systemPrompt';
import { requestSandboxState } from './rpc/requestSandboxState';
import { createReadSandboxStateTool } from './tools/readSandboxStateTool';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const env = parseAgentEnv(process.env);

    await ctx.connect();
    const participant = (await ctx.waitForParticipant()) as RemoteParticipant;

    const agent = new voice.Agent({
      instructions: RAMS_SYSTEM_PROMPT,
      tools: {
        readSandboxState: createReadSandboxStateTool(async (args) =>
          requestSandboxState(ctx, participant, { ...args, turnId: args.turnId || createTurnId() }),
        ),
      },
    });

    const session = new voice.AgentSession({
      llm: createAzureRealtimeModel(env),
    });

    await session.start({ agent, room: ctx.room });
    await session.generateReply({
      instructions: 'Greet the user, ask them to write a tiny JavaScript function, and tell them you will inspect the live sandbox when they make code claims.',
    });
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
```

- [ ] **Step 4: Run chunk-level verification**

Run: `pnpm check && pnpm test`
Expected: PASS across `shared`, `web`, `api`, and `agent`

- [ ] **Step 5: Commit**

```bash
git add apps/agent/src/tools apps/agent/src/index.ts apps/agent/src/rams/systemPrompt.ts packages/shared/src/contracts/turns.ts packages/shared/src/index.ts
git commit -m "feat: let rams inspect sandbox state"
```
