# Soma MVP-1 Chunked Implementation Plan Overview

**Spec source:** `docs/superpowers/specs/2026-05-21-soma-mvp1-voice-sandbox-rpc-design.md`

## Goal

Implement the approved MVP-1 slice: a single-user RAMS session where the user talks to a LiveKit-backed voice agent, writes/runs JavaScript or TypeScript in a browser WebContainer, and the agent inspects live sandbox state over LiveKit Room RPC before challenging the user.

## Execution mode

This plan is written for **subagent-driven development**. Another agent should execute it with fresh implementer/reviewer loops per task, not as one giant uninterrupted coding pass.

## Chunk order

1. `docs/superpowers/plans/2026-05-21-soma-mvp1/01-foundation-and-web-shell.md`
   - create the workspace, shared contracts, thin API layer, and browser voice shell
2. `docs/superpowers/plans/2026-05-21-soma-mvp1/02-agent-service-azure-realtime.md`
   - add the LiveKit agent service and Azure realtime model wiring
3. `docs/superpowers/plans/2026-05-21-soma-mvp1/03-browser-sandbox-and-rpc.md`
   - add WebContainer worker, sandbox UI, Room RPC registration, and agent-side RPC tool wiring
4. `docs/superpowers/plans/2026-05-21-soma-mvp1/04-persistence-hardening-and-demo.md`
   - add raw event persistence, smoke docs, integration hardening, and final verification

## Repo shape to build

```text
.
├─ apps/
│  ├─ web/
│  ├─ api/
│  └─ agent/
├─ packages/
│  └─ shared/
├─ data/
│  └─ session-events/
└─ docs/
   ├─ superpowers/specs/
   ├─ superpowers/plans/
   └─ demo/
```

## Global architecture decisions

- **Monorepo:** `pnpm` + TypeScript
- **Frontend:** Vite + React
- **Thin API layer:** Hono on Node.js for MVP simplicity
- **Voice agent:** LiveKit Agents 1.x with `AgentSession`
- **Default provider:** Azure OpenAI
- **Primary audio model:** `gpt-realtime-2`
- **Optional transcript sidecar:** `gpt-realtime-whisper`
- **Sandbox:** WebContainer inside a dedicated Web Worker
- **Bridge:** LiveKit Room RPC
- **Persistence:** file-backed JSONL raw event logging for MVP-1

## Non-goals to enforce during implementation

- do **not** add guest links
- do **not** add multiplayer collaboration
- do **not** add Pyodide unless blocked by WebContainer limits
- do **not** add long-term memory compaction
- do **not** add `gpt-chat-latest` to the live audio loop
- do **not** use deprecated `MultimodalAgent` code paths

## Global verification commands

Run these after each chunk unless a more focused command is listed in the chunk file:

```bash
pnpm install
pnpm check
pnpm test
```

Final smoke targets:

1. browser can fetch a LiveKit token and connect
2. agent service can boot with Azure defaults
3. browser sandbox can run a simple JS file
4. agent can fetch sandbox state via RPC
5. JSONL events are persisted locally
6. the demo scenario in `docs/demo/voice-sandbox-rpc-smoke.md` passes manually

## Research artifacts

These files were used to shape the plan and should remain available to the implementation agent:

- `docs/research/2026-05-21-local-scout.md`
- `docs/research/2026-05-21-livekit-research.md`
- `docs/research/2026-05-21-cloudflare-memory-research.md`
- `docs/research/2026-05-21-browser-sandbox-research.md`
