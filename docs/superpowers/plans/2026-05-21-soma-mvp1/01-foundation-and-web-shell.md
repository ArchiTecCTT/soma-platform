# Soma MVP-1 Chunk 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the pnpm TypeScript monorepo, shared contracts, thin API layer, and browser voice shell needed to join a LiveKit room.

**Architecture:** Build a four-package workspace (`web`, `api`, `agent`, `shared`) with shared Zod contracts first, then expose a minimal `/health` and `/livekit/token` API, then connect a React voice shell that can request a token and join a room. Keep the first chunk free of sandbox and agent-side RPC logic.

**Tech Stack:** pnpm, TypeScript, Vitest, Zod, Hono, React, Vite, LiveKit client, LiveKit server SDK.

---

### Task 1: Bootstrap the monorepo and shared contract package

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/contracts/env.ts`
- Create: `packages/shared/src/contracts/rpc.ts`
- Create: `packages/shared/src/contracts/events.ts`
- Create: `packages/shared/src/contracts/env.test.ts`
- Create: `packages/shared/src/contracts/rpc.test.ts`

- [ ] **Step 1: Create the root workspace files**

```json
{
  "name": "soma-platform",
  "private": true,
  "packageManager": "pnpm@10.11.0",
  "scripts": {
    "build": "pnpm -r build",
    "check": "pnpm -r check",
    "test": "pnpm -r test",
    "dev:web": "pnpm --filter @soma/web dev",
    "dev:api": "pnpm --filter @soma/api dev",
    "dev:agent": "pnpm --filter @soma/agent dev"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "tsx": "^4.19.3",
    "vitest": "^3.1.2",
    "@types/node": "^22.15.18"
  }
}
```

```yaml
packages:
  - apps/*
  - packages/*
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "types": ["node"]
  }
}
```

```gitignore
node_modules
.env
.env.*
dist
coverage
.data
.vite
.playwright
data/session-events/*.jsonl
!data/session-events/.gitkeep
```

```dotenv
LIVEKIT_WS_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=lk_api_key
LIVEKIT_API_SECRET=lk_api_secret
API_PORT=8787
VITE_API_BASE_URL=http://localhost:8787
API_BASE_URL=http://localhost:8787
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=azure_openai_api_key
AZURE_OPENAI_REALTIME_DEPLOYMENT=gpt-realtime-2
AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT=gpt-realtime-whisper
OPENAI_API_VERSION=2025-04-01-preview
EVENTS_DIR=data/session-events
```

- [ ] **Step 2: Create the shared package manifest and TS config**

```json
{
  "name": "@soma/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "check": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.24.4"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Write the failing shared env contract test**

```ts
import { describe, expect, it } from 'vitest';
import { apiEnvSchema, agentEnvSchema, webEnvSchema } from './env';

describe('runtime env schemas', () => {
  it('accepts valid API env', () => {
    const result = apiEnvSchema.parse({
      LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
      LIVEKIT_API_KEY: 'key',
      LIVEKIT_API_SECRET: 'secret',
      API_PORT: '8787',
      EVENTS_DIR: 'data/session-events',
    });

    expect(result.API_PORT).toBe('8787');
  });

  it('rejects missing Azure realtime deployment', () => {
    expect(() =>
      agentEnvSchema.parse({
        LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
        LIVEKIT_API_KEY: 'key',
        LIVEKIT_API_SECRET: 'secret',
        AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
        AZURE_OPENAI_API_KEY: 'azure-key',
        OPENAI_API_VERSION: '2025-04-01-preview',
        API_BASE_URL: 'http://localhost:8787',
      }),
    ).toThrow();
  });

  it('accepts valid agent env', () => {
    const result = agentEnvSchema.parse({
      LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
      LIVEKIT_API_KEY: 'key',
      LIVEKIT_API_SECRET: 'secret',
      AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
      AZURE_OPENAI_API_KEY: 'azure-key',
      AZURE_OPENAI_REALTIME_DEPLOYMENT: 'gpt-realtime-2',
      OPENAI_API_VERSION: '2025-04-01-preview',
      API_BASE_URL: 'http://localhost:8787',
    });

    expect(result.API_BASE_URL).toBe('http://localhost:8787');
  });

  it('accepts valid web env', () => {
    const result = webEnvSchema.parse({
      VITE_API_BASE_URL: 'http://localhost:8787',
    });

    expect(result.VITE_API_BASE_URL).toBe('http://localhost:8787');
  });
});
```

- [ ] **Step 4: Run the shared test to verify it fails**

Run: `pnpm install && pnpm --filter @soma/shared test`
Expected: FAIL with module-not-found or missing exports for `./env`

- [ ] **Step 5: Implement the env schemas and exports**

```ts
import { z } from 'zod';

const url = z.string().url();
const required = z.string().min(1);

export const apiEnvSchema = z.object({
  LIVEKIT_WS_URL: url,
  LIVEKIT_API_KEY: required,
  LIVEKIT_API_SECRET: required,
  API_PORT: z.string().default('8787'),
  EVENTS_DIR: z.string().default('data/session-events'),
});

export const agentEnvSchema = z.object({
  LIVEKIT_WS_URL: url,
  LIVEKIT_API_KEY: required,
  LIVEKIT_API_SECRET: required,
  AZURE_OPENAI_ENDPOINT: url,
  AZURE_OPENAI_API_KEY: required,
  AZURE_OPENAI_REALTIME_DEPLOYMENT: required,
  AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT: required.optional(),
  OPENAI_API_VERSION: required,
  EVENTS_DIR: z.string().default('data/session-events'),
  API_BASE_URL: url,
});

export const webEnvSchema = z.object({
  VITE_API_BASE_URL: url,
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type AgentEnv = z.infer<typeof agentEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
```

```ts
import { z } from 'zod';

export const SandboxFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

export const SandboxStateSchema = z.object({
  sessionId: z.string().min(1),
  turnId: z.string().min(1),
  activeFilePath: z.string().min(1),
  files: z.array(SandboxFileSchema).max(5),
  stdoutTail: z.string(),
  stderrTail: z.string(),
  lastCommand: z.string().nullable(),
  exitCode: z.number().int().nullable(),
  status: z.enum(['idle', 'running', 'completed', 'error']),
  capturedAt: z.string().datetime(),
});

export const ReadSandboxStateRequestSchema = z.object({
  sessionId: z.string().min(1),
  turnId: z.string().min(1),
  maxChars: z.number().int().positive().max(8000).default(4000),
});

export type SandboxState = z.infer<typeof SandboxStateSchema>;
export type ReadSandboxStateRequest = z.infer<typeof ReadSandboxStateRequestSchema>;
```

```ts
import { z } from 'zod';

export const SessionEventSchema = z.object({
  sessionId: z.string().min(1),
  turnId: z.string().min(1).optional(),
  kind: z.enum([
    'session.lifecycle',
    'user.message',
    'agent.message',
    'sandbox.run',
    'sandbox.snapshot',
    'rpc.request',
    'rpc.response',
  ]),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
});

export type SessionEvent = z.infer<typeof SessionEventSchema>;
```

```ts
export * from './contracts/env';
export * from './contracts/rpc';
export * from './contracts/events';
```

- [ ] **Step 6: Write the failing RPC contract test**

```ts
import { describe, expect, it } from 'vitest';
import { ReadSandboxStateRequestSchema, SandboxStateSchema } from './rpc';

describe('rpc contracts', () => {
  it('caps maxChars on sandbox reads', () => {
    expect(() =>
      ReadSandboxStateRequestSchema.parse({
        sessionId: 's-1',
        turnId: 't-1',
        maxChars: 9000,
      }),
    ).toThrow();
  });

  it('accepts a bounded sandbox snapshot', () => {
    const result = SandboxStateSchema.parse({
      sessionId: 's-1',
      turnId: 't-1',
      activeFilePath: '/src/index.js',
      files: [{ path: '/src/index.js', content: 'console.log(1);' }],
      stdoutTail: '1',
      stderrTail: '',
      lastCommand: 'node src/index.js',
      exitCode: 0,
      status: 'completed',
      capturedAt: '2026-05-21T00:00:00.000Z',
    });

    expect(result.files).toHaveLength(1);
  });
});
```

- [ ] **Step 7: Run the shared tests to verify they pass**

Run: `pnpm --filter @soma/shared test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .env.example packages/shared
git commit -m "chore: scaffold soma workspace"
```

### Task 2: Add the thin API layer and LiveKit token endpoint

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/env.ts`
- Create: `apps/api/src/livekit-token.ts`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/index.test.ts`

- [ ] **Step 1: Create the API package manifest and config**

```json
{
  "name": "@soma/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "check": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@hono/node-server": "^1.14.4",
    "@soma/shared": "workspace:*",
    "dotenv": "^16.4.7",
    "hono": "^4.7.7",
    "livekit-server-sdk": "^2.9.2"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2: Write the failing API route test**

```ts
import { describe, expect, it } from 'vitest';
import { createApp } from './index';

describe('api routes', () => {
  it('serves /health', async () => {
    const app = createApp({
      LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
      LIVEKIT_API_KEY: 'key',
      LIVEKIT_API_SECRET: 'secret',
      API_PORT: '8787',
      EVENTS_DIR: 'data/session-events',
    });

    const response = await app.request('/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('returns a room token', async () => {
    const app = createApp({
      LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
      LIVEKIT_API_KEY: 'key',
      LIVEKIT_API_SECRET: 'secret',
      API_PORT: '8787',
      EVENTS_DIR: 'data/session-events',
    });

    const response = await app.request('/livekit/token?room=soma-mvp&identity=user-1');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.wsUrl).toBe('wss://example.livekit.cloud');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 3: Run the API test to verify it fails**

Run: `pnpm --filter @soma/api test`
Expected: FAIL with module-not-found for `./index`

- [ ] **Step 4: Implement the API env parser, token generator, and Hono app**

```ts
import { apiEnvSchema, type ApiEnv } from '@soma/shared';

export function parseApiEnv(input: Record<string, string | undefined>): ApiEnv {
  return apiEnvSchema.parse(input);
}
```

```ts
import { AccessToken } from 'livekit-server-sdk';
import type { ApiEnv } from '@soma/shared';

export async function createLiveKitJoinToken(env: ApiEnv, room: string, identity: string) {
  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity,
    ttl: '15m',
  });

  token.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return {
    wsUrl: env.LIVEKIT_WS_URL,
    token: await token.toJwt(),
  };
}
```

```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseApiEnv } from './env';
import { createLiveKitJoinToken } from './livekit-token';

export function createApp(rawEnv = process.env) {
  const env = parseApiEnv(rawEnv);
  const app = new Hono();

  app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));

  app.get('/health', (c) => c.json({ ok: true }));

  app.get('/livekit/token', async (c) => {
    const room = c.req.query('room') ?? 'soma-mvp';
    const identity = c.req.query('identity') ?? `user-${crypto.randomUUID()}`;
    const payload = await createLiveKitJoinToken(env, room, identity);
    return c.json(payload);
  });

  return app;
}
```

```ts
import 'dotenv/config';
import { serve } from '@hono/node-server';
import { parseApiEnv } from './env';
import { createApp } from './index';

const env = parseApiEnv(process.env);
const app = createApp(env);

serve({
  fetch: app.fetch,
  port: Number(env.API_PORT),
});
```

- [ ] **Step 5: Run the API tests to verify they pass**

Run: `pnpm --filter @soma/api test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api
git commit -m "feat: add livekit token api"
```

### Task 3: Add the browser voice shell and token-fetching client

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/hooks/useVoiceRoom.ts`
- Create: `apps/web/src/components/VoiceSessionShell.tsx`
- Create: `apps/web/src/lib/api.test.ts`

- [ ] **Step 1: Create the web package manifest and TS config**

```json
{
  "name": "@soma/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "check": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@soma/shared": "workspace:*",
    "@webcontainer/api": "^1.5.1",
    "livekit-client": "^2.15.7",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@vitejs/plugin-react": "^4.4.1",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "vite": "^6.3.5"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"]
}
```

- [ ] **Step 2: Write the failing API client test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { fetchLiveKitToken } from './api';

describe('fetchLiveKitToken', () => {
  it('fetches the room token payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ wsUrl: 'wss://example.livekit.cloud', token: 'jwt-value' }),
      }),
    );

    const result = await fetchLiveKitToken('http://localhost:8787', 'soma-mvp', 'user-1');
    expect(result.wsUrl).toBe('wss://example.livekit.cloud');
    expect(result.token).toBe('jwt-value');
  });
});
```

- [ ] **Step 3: Run the web test to verify it fails**

Run: `pnpm --filter @soma/web test`
Expected: FAIL with module-not-found for `./api`

- [ ] **Step 4: Implement the Vite app, API client, and minimal voice shell**

```ts
// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envDir: '../../',
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});
```

```html
<!-- apps/web/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Soma MVP-1</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```ts
// apps/web/src/lib/api.ts
export async function fetchLiveKitToken(apiBaseUrl: string, room: string, identity: string) {
  const url = new URL('/livekit/token', apiBaseUrl);
  url.searchParams.set('room', room);
  url.searchParams.set('identity', identity);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Token fetch failed: ${response.status}`);
  }

  return response.json() as Promise<{ wsUrl: string; token: string }>;
}
```

```ts
import { useMemo, useState } from 'react';
import { Room } from 'livekit-client';
import { fetchLiveKitToken } from '../lib/api';

export function useVoiceRoom(apiBaseUrl: string) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const room = useMemo(() => new Room(), []);

  async function connect(roomName: string, identity: string) {
    setStatus('connecting');
    setError(null);

    try {
      const { wsUrl, token } = await fetchLiveKitToken(apiBaseUrl, roomName, identity);
      await room.connect(wsUrl, token);
      setStatus('connected');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Unknown room connection error');
    }
  }

  async function disconnect() {
    await room.disconnect();
    setStatus('idle');
  }

  return { room, status, error, connect, disconnect };
}
```

```tsx
import { useState } from 'react';
import { useVoiceRoom } from '../hooks/useVoiceRoom';

export function VoiceSessionShell({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [roomName] = useState('soma-mvp');
  const [identity] = useState(`user-${crypto.randomUUID()}`);
  const { status, error, connect, disconnect } = useVoiceRoom(apiBaseUrl);

  return (
    <section>
      <h1>Soma MVP-1</h1>
      <p>Room: {roomName}</p>
      <p>Status: {status}</p>
      {error ? <p role="alert">{error}</p> : null}
      {status === 'connected' ? (
        <button onClick={() => void disconnect()}>Leave session</button>
      ) : (
        <button onClick={() => void connect(roomName, identity)}>Join session</button>
      )}
    </section>
  );
}
```

```tsx
import { VoiceSessionShell } from './components/VoiceSessionShell';

export default function App() {
  return <VoiceSessionShell apiBaseUrl={import.meta.env.VITE_API_BASE_URL} />;
}
```

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 5: Run focused verification for the web shell**

Run: `pnpm --filter @soma/web test && pnpm --filter @soma/web check`
Expected: PASS

- [ ] **Step 6: Run chunk-level verification**

Run: `pnpm check && pnpm test`
Expected: PASS across `shared`, `api`, and `web`

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat: add soma voice session shell"
```
