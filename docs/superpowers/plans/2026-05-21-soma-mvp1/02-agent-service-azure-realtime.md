# Soma MVP-1 Chunk 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the LiveKit agent service that uses Azure OpenAI realtime speech as the default RAMS voice path.

**Architecture:** Build a Node.js LiveKit worker with `defineAgent`, `voice.Agent`, and `voice.AgentSession`. Keep the agent deliberately narrow in this chunk: boot, join the room, greet the user, and run on Azure `gpt-realtime-2` with a RAMS-specific prompt. Do not add sandbox RPC yet.

**Tech Stack:** TypeScript, LiveKit Agents 1.x, Azure OpenAI realtime, Vitest, Zod, tsx.

> **Important LiveKit Version Note:** Before coding, verify the exact exported names/signatures of the `@livekit/agents` and `@livekit/agents-plugin-openai` packages against the installed SDK. If the package version differs from the snippets shown below, adjust imports/options accordingly (e.g. `openai.realtime.RealtimeModel` or exact Azure OpenAI connection configurations).

---

### Task 1: Create the agent package, env parser, and Azure realtime model builder

**Files:**
- Create: `apps/agent/package.json`
- Create: `apps/agent/tsconfig.json`
- Create: `apps/agent/src/env.ts`
- Create: `apps/agent/src/realtime/createAzureRealtimeModel.ts`
- Create: `apps/agent/src/realtime/createAzureRealtimeModel.test.ts`

- [ ] **Step 1: Create the agent package manifest and TS config**

```json
{
  "name": "@soma/agent",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts dev",
    "build": "tsc -p tsconfig.json",
    "check": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@livekit/agents": "^1.0.18",
    "@livekit/agents-plugin-openai": "^1.0.18",
    "@soma/shared": "workspace:*",
    "dotenv": "^16.5.0"
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

- [ ] **Step 2: Write the failing Azure realtime model test**

```ts
import { describe, expect, it } from 'vitest';
import { buildAzureRealtimeOptions } from './createAzureRealtimeModel';

describe('buildAzureRealtimeOptions', () => {
  it('maps env into a LiveKit Azure realtime config', () => {
    const result = buildAzureRealtimeOptions({
      LIVEKIT_WS_URL: 'wss://example.livekit.cloud',
      LIVEKIT_API_KEY: 'lk-key',
      LIVEKIT_API_SECRET: 'lk-secret',
      AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
      AZURE_OPENAI_API_KEY: 'azure-key',
      AZURE_OPENAI_REALTIME_DEPLOYMENT: 'gpt-realtime-2',
      AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT: 'gpt-realtime-whisper',
      OPENAI_API_VERSION: '2025-04-01-preview',
      API_BASE_URL: 'http://localhost:8787',
      EVENTS_DIR: 'data/session-events',
    });

    expect(result.azureDeployment).toBe('gpt-realtime-2');
    expect(result.apiVersion).toBe('2025-04-01-preview');
    expect(result.azureEndpoint).toBe('https://example.openai.azure.com');
    expect(result.inputAudioTranscription?.model).toBe('gpt-realtime-whisper');
  });
});
```

- [ ] **Step 3: Run the agent test to verify it fails**

Run: `pnpm --filter @soma/agent test`
Expected: FAIL with module-not-found for `./createAzureRealtimeModel`

- [ ] **Step 4: Implement the agent env parser and realtime model builder**

```ts
import { agentEnvSchema, type AgentEnv } from '@soma/shared';

export function parseAgentEnv(input: Record<string, string | undefined>): AgentEnv {
  return agentEnvSchema.parse(input);
}
```

```ts
import * as openai from '@livekit/agents-plugin-openai';
import type { AgentEnv } from '@soma/shared';

export function buildAzureRealtimeOptions(env: AgentEnv) {
  return {
    azureDeployment: env.AZURE_OPENAI_REALTIME_DEPLOYMENT,
    azureEndpoint: env.AZURE_OPENAI_ENDPOINT,
    apiKey: env.AZURE_OPENAI_API_KEY,
    apiVersion: env.OPENAI_API_VERSION,
    voice: 'alloy',
    inputAudioTranscription: env.AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT
      ? { model: env.AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT }
      : undefined,
  };
}

export function createAzureRealtimeModel(env: AgentEnv) {
  return openai.realtime.RealtimeModel.withAzure(buildAzureRealtimeOptions(env));
}
```

- [ ] **Step 5: Run the agent tests to verify they pass**

Run: `pnpm --filter @soma/agent test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/agent/package.json apps/agent/tsconfig.json apps/agent/src/env.ts apps/agent/src/realtime
git commit -m "feat: add azure realtime model builder"
```

### Task 2: Add the RAMS prompt and the LiveKit worker entrypoint

**Files:**
- Create: `apps/agent/src/rams/systemPrompt.ts`
- Create: `apps/agent/src/rams/systemPrompt.test.ts`
- Create: `apps/agent/src/index.ts`

- [ ] **Step 1: Write the failing RAMS prompt test**

```ts
import { describe, expect, it } from 'vitest';
import { RAMS_SYSTEM_PROMPT } from './systemPrompt';

describe('RAMS_SYSTEM_PROMPT', () => {
  it('enforces the sparring posture and evidence-first behavior', () => {
    expect(RAMS_SYSTEM_PROMPT).toContain('Do not flatter the user');
    expect(RAMS_SYSTEM_PROMPT).toContain('Ask the user to explain their reasoning');
    expect(RAMS_SYSTEM_PROMPT).toContain('Prefer evidence from the sandbox state');
  });
});
```

- [ ] **Step 2: Run the RAMS prompt test to verify it fails**

Run: `pnpm --filter @soma/agent test`
Expected: FAIL with module-not-found for `./systemPrompt`

- [ ] **Step 3: Implement the prompt and worker entrypoint**

```ts
export const RAMS_SYSTEM_PROMPT = [
  'You are RAMS, an adversarial technical mentor.',
  'Do not flatter the user or offer empty reassurance.',
  'Ask the user to explain their reasoning before accepting a claim.',
  'Challenge false premises directly and briefly.',
  'Prefer evidence from the sandbox state and actual runtime output over guesswork.',
  'If the user is correct, acknowledge it cleanly and move forward.',
  'If the user is wrong, say what is wrong and why.',
  'Keep answers short, concrete, and technically precise.',
].join(' ');
```

```ts
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { cli, defineAgent, voice, WorkerOptions, type JobContext } from '@livekit/agents';
import { parseAgentEnv } from './env';
import { createAzureRealtimeModel } from './realtime/createAzureRealtimeModel';
import { RAMS_SYSTEM_PROMPT } from './rams/systemPrompt';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const env = parseAgentEnv(process.env);

    await ctx.connect();
    await ctx.waitForParticipant();

    const agent = new voice.Agent({
      instructions: RAMS_SYSTEM_PROMPT,
    });

    const session = new voice.AgentSession({
      llm: createAzureRealtimeModel(env),
    });

    await session.start({
      agent,
      room: ctx.room,
    });

    await session.generateReply({
      instructions: 'Greet the user, explain that you will challenge their reasoning, and ask them to implement a tiny JavaScript function.',
    });
  },
});

cli.runApp(new WorkerOptions({
  agent: fileURLToPath(import.meta.url),
}));
```

- [ ] **Step 4: Run focused verification for the prompt and worker**

Run: `pnpm --filter @soma/agent test && pnpm --filter @soma/agent check`
Expected: PASS

- [ ] **Step 5: Add a manual boot smoke command to the package README notes in the commit message**

Run: `pnpm --filter @soma/agent build`
Expected: PASS and produce a bootable agent worker bundle in `apps/agent/dist`

- [ ] **Step 6: Commit**

```bash
git add apps/agent/src/rams apps/agent/src/index.ts
git commit -m "feat: add rams azure livekit worker"
```

### Task 3: Verify chunk integration without adding sandbox logic yet

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a short local-dev section to the README**

```md
## Local MVP-1 services

- `pnpm dev:api` — starts the token API on `http://localhost:8787`
- `pnpm dev:web` — starts the browser shell
- `pnpm dev:agent` — starts the LiveKit worker with Azure realtime defaults
```

- [ ] **Step 2: Run chunk-level verification**

Run: `pnpm check && pnpm test`
Expected: PASS across `shared`, `api`, `web`, and `agent`

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add local mvp services"
```
