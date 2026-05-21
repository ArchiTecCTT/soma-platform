# Soma MVP-1 Chunk 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist raw session events, document the smoke path, and harden the integrated system enough for another agent or human to demo the full MVP loop.

**Architecture:** Keep persistence intentionally simple: a thin API route writes JSONL events into `data/session-events/<sessionId>.jsonl`. Both the browser and the agent emit events through small helpers. The final part of the chunk is verification and documentation, not new product scope.

**Tech Stack:** Node filesystem APIs, Hono, Vitest, TypeScript, markdown docs.

---

### Task 1: Add file-backed raw event persistence to the API layer

**Files:**
- Create: `data/session-events/.gitkeep`
- Create: `apps/api/src/store/fileEventStore.ts`
- Create: `apps/api/src/store/fileEventStore.test.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Add the persistence directory placeholder**

```text
data/session-events/.gitkeep
```

- [ ] **Step 2: Write the failing file store test**

```ts
import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { appendSessionEvent } from './fileEventStore';

describe('appendSessionEvent', () => {
  it('appends JSONL events into a per-session file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'soma-events-'));

    try {
      await appendSessionEvent(dir, {
        sessionId: 'session-1',
        kind: 'user.message',
        payload: { text: 'hello' },
        createdAt: '2026-05-21T00:00:00.000Z',
      });

      const contents = await readFile(join(dir, 'session-1.jsonl'), 'utf8');
      expect(contents).toContain('user.message');
      expect(contents).toContain('hello');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 3: Run the API tests to verify they fail**

Run: `pnpm --filter @soma/api test`
Expected: FAIL with module-not-found for `./fileEventStore`

- [ ] **Step 4: Implement the JSONL file store**

```ts
import { mkdir, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SessionEventSchema, type SessionEvent } from '@soma/shared';

export async function appendSessionEvent(eventsDir: string, rawEvent: Omit<SessionEvent, 'turnId'> & { turnId?: string }) {
  const event = SessionEventSchema.parse(rawEvent);
  await mkdir(eventsDir, { recursive: true });
  const filePath = join(eventsDir, `${event.sessionId}.jsonl`);
  await appendFile(filePath, `${JSON.stringify(event)}\n`, 'utf8');
  return filePath;
}
```

- [ ] **Step 5: Add the `/events` route to the API app**

```ts
import { Hono } from 'hono';
import { parseApiEnv } from './env';
import { createLiveKitJoinToken } from './livekit-token';
import { SessionEventSchema } from '@soma/shared';
import { appendSessionEvent } from './store/fileEventStore';

export function createApp(rawEnv = process.env) {
  const env = parseApiEnv(rawEnv);
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true }));

  app.get('/livekit/token', async (c) => {
    const room = c.req.query('room') ?? 'soma-mvp';
    const identity = c.req.query('identity') ?? `user-${crypto.randomUUID()}`;
    const payload = await createLiveKitJoinToken(env, room, identity);
    return c.json(payload);
  });

  app.post('/events', async (c) => {
    const body = await c.req.json();
    const event = SessionEventSchema.parse(body);
    const filePath = await appendSessionEvent(env.EVENTS_DIR, event);
    return c.json({ ok: true, filePath });
  });

  return app;
}
```

- [ ] **Step 6: Run focused verification for persistence**

Run: `pnpm --filter @soma/api test && pnpm --filter @soma/api check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add data/session-events apps/api/src/store apps/api/src/index.ts
git commit -m "feat: persist raw session events"
```

### Task 2: Emit events from the browser and the agent

**Files:**
- Create: `apps/web/src/lib/events.ts`
- Create: `apps/agent/src/lib/events.ts`
- Create: `apps/web/src/lib/events.test.ts`
- Modify: `apps/web/src/components/VoiceSessionShell.tsx`
- Modify: `apps/web/src/components/CodeWorkspace.tsx`
- Modify: `apps/agent/src/index.ts`

- [ ] **Step 1: Write the failing browser event helper test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { postSessionEvent } from './events';

describe('postSessionEvent', () => {
  it('posts session events to the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);

    await postSessionEvent('http://localhost:8787', {
      sessionId: 'session-1',
      turnId: 'turn-1',
      kind: 'user.message',
      payload: { text: 'hello' },
      createdAt: '2026-05-21T00:00:00.000Z',
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8787/events', expect.any(Object));
  });
});
```

- [ ] **Step 2: Run the web tests to verify they fail**

Run: `pnpm --filter @soma/web test`
Expected: FAIL with module-not-found for `./events`

- [ ] **Step 3: Implement browser and agent event emitters**

```ts
import { SessionEventSchema, type SessionEvent } from '@soma/shared';

export async function postSessionEvent(apiBaseUrl: string, rawEvent: SessionEvent) {
  const event = SessionEventSchema.parse(rawEvent);
  const response = await fetch(`${apiBaseUrl}/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Event post failed: ${response.status}`);
  }

  return response.json();
}
```

```ts
import { SessionEventSchema, type SessionEvent } from '@soma/shared';

export async function postAgentEvent(apiBaseUrl: string, rawEvent: SessionEvent) {
  const event = SessionEventSchema.parse(rawEvent);
  const response = await fetch(`${apiBaseUrl}/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Agent event post failed: ${response.status}`);
  }

  return response.json();
}
```

- [ ] **Step 4: Wire browser event emission into join/run flows**

```tsx
import { CodeWorkspace } from './CodeWorkspace';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { useSandbox } from '../hooks/useSandbox';
import { registerSandboxRpc } from '../livekit/registerSandboxRpc';
import { postSessionEvent } from '../lib/events';

export function VoiceSessionShell({ apiBaseUrl }: { apiBaseUrl: string }) {
  const sessionId = 'soma-mvp-demo';
  const sandbox = useSandbox();
  const { room, status, error, connect, disconnect } = useVoiceRoom(apiBaseUrl);

  async function handleJoin() {
    const identity = `user-${crypto.randomUUID()}`;
    await connect('soma-mvp', identity);
    registerSandboxRpc(room, sandbox.client);
    await postSessionEvent(apiBaseUrl, {
      sessionId,
      kind: 'session.lifecycle',
      payload: { action: 'joined', identity },
      createdAt: new Date().toISOString(),
    });
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
      <CodeWorkspace apiBaseUrl={apiBaseUrl} sessionId={sessionId} sandbox={sandbox} />
    </section>
  );
}
```

```tsx
import { postSessionEvent } from '../lib/events';
import { useSandbox } from '../hooks/useSandbox';

export function CodeWorkspace({
  apiBaseUrl,
  sessionId,
  sandbox,
}: {
  apiBaseUrl: string;
  sessionId: string;
  sandbox: ReturnType<typeof useSandbox>;
}) {
  const { code, stdout, status, syncActiveFile, run } = sandbox;

  async function handleRun() {
    await run();
    await postSessionEvent(apiBaseUrl, {
      sessionId,
      kind: 'sandbox.run',
      payload: { activeFilePath: '/src/index.js', status, stdout },
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <section>
      <h2>Workspace</h2>
      <textarea value={code} onChange={(event) => void syncActiveFile(event.target.value)} rows={18} cols={80} />
      <div>
        <button onClick={() => void handleRun()}>Run code</button>
        <span> Sandbox status: {status}</span>
      </div>
      <pre>{stdout}</pre>
    </section>
  );
}
```

- [ ] **Step 5: Wire a minimal agent-side lifecycle event**

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
import { postAgentEvent } from './lib/events';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const env = parseAgentEnv(process.env);
    await ctx.connect();
    const participant = (await ctx.waitForParticipant()) as RemoteParticipant;

    await postAgentEvent(env.API_BASE_URL, {
      sessionId: ctx.room.name,
      kind: 'session.lifecycle',
      payload: { action: 'agent-joined', participant: participant.identity },
      createdAt: new Date().toISOString(),
    });

    const agent = new voice.Agent({
      instructions: RAMS_SYSTEM_PROMPT,
      tools: {
        readSandboxState: createReadSandboxStateTool(async (args) =>
          requestSandboxState(ctx, participant, { ...args, turnId: args.turnId || createTurnId() }),
        ),
      },
    });

    const session = new voice.AgentSession({ llm: createAzureRealtimeModel(env) });
    await session.start({ agent, room: ctx.room });
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
```

- [ ] **Step 6: Run chunk-level verification for event posting**

Run: `pnpm check && pnpm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/events.ts apps/agent/src/lib/events.ts apps/web/src/components/VoiceSessionShell.tsx apps/web/src/components/CodeWorkspace.tsx apps/agent/src/index.ts
git commit -m "feat: log soma session events"
```

### Task 3: Add the manual smoke script and final verification checklist

**Files:**
- Create: `docs/demo/voice-sandbox-rpc-smoke.md`
- Modify: `README.md`

- [ ] **Step 1: Write the manual smoke script**

```md
# Soma MVP-1 Smoke Script

1. Start the API:
   - `pnpm dev:api`
2. Start the web app:
   - `pnpm dev:web`
3. Start the LiveKit agent worker:
   - `pnpm dev:agent`
4. Open the browser shell and click **Join session**.
5. Confirm a token is fetched and the room connects.
6. In the workspace, change the code to:
   ```js
   export function add(a, b) {
     return a - b;
   }

   console.log(add(2, 3));
   ```
7. Click **Run code** and verify the output is `-1`.
8. Tell RAMS: “My add function is correct.”
9. Verify RAMS asks to inspect or uses the sandbox state before agreeing.
10. Verify a file is created in `data/session-events/` for the session.
```

- [ ] **Step 2: Add a README verification section**

```md
## MVP-1 verification

- `pnpm check`
- `pnpm test`
- Follow `docs/demo/voice-sandbox-rpc-smoke.md`
```

- [ ] **Step 3: Run final verification before handing off**

Run:

```bash
pnpm install
pnpm check
pnpm test
```

Expected: PASS

Then manually perform the smoke script in `docs/demo/voice-sandbox-rpc-smoke.md`.
Expected: the browser joins the room, the sandbox runs code, the agent can inspect it, and JSONL events are written.

- [ ] **Step 4: Commit**

```bash
git add docs/demo/voice-sandbox-rpc-smoke.md README.md
git commit -m "docs: add soma smoke verification"
```
