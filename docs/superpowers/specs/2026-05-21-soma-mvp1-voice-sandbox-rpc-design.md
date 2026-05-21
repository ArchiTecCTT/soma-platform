# Soma MVP-1 Design: Voice + Sandbox RPC Loop

**Date:** 2026-05-21
**Status:** Draft for review
**Primary slice:** MVP-1 / Chunked planning target

## Goal

Deliver the thinnest credible proof of the Soma Platform: a single-user, real-time voice mentor that can inspect live browser-executed code and challenge the user based on actual sandbox state, not just chat transcript.

This MVP is intentionally narrower than the full Soma / RAMS vision. It proves the core loop first: **voice conversation + browser sandbox + live RPC-based inspection + adversarial teaching feedback**.

## Why this slice

The repository vision and feasibility study define five major subsystems:

1. real-time multimodal voice
2. browser code execution
3. agent orchestration / sparring behavior
4. long-term memory compaction / proactivity
5. social ingress / collaboration

Trying to build all five at once would create unnecessary platform risk. MVP-1 instead proves the product thesis with the smallest possible integrated system:

- the user talks to RAMS
- the user writes or runs code locally in the browser
- RAMS can inspect the live state of that code via RPC
- RAMS critiques, questions, or redirects based on evidence

If this loop works reliably, the rest of the platform can be layered on later.

## Product scope

### In scope

- single-user session
- low-latency voice conversation via LiveKit
- Azure as the default model provider
- browser code editor
- browser JavaScript / TypeScript execution sandbox
- server agent requesting sandbox state over LiveKit Room RPC
- RAMS responding to actual files, stdout, runtime status, and user speech
- basic event persistence for future memory work

### Out of scope for MVP-1

- overnight memory compaction
- zero-prompt proactive wakeups / daily curriculum generation
- guest drop-in links / social ingress
- multiplayer collaboration or shared cursors
- multi-language runtime matrix beyond the first browser runtime
- translation workflows
- long-horizon LangGraph memory system
- full biological-memory architecture

## Architecture decision summary

### Core decision

Use a split system:

- **Frontend**: TypeScript browser app for voice UI, editor, and sandbox controls
- **Realtime transport**: LiveKit rooms and media transport
- **Voice agent service**: LiveKit Agents 1.x using `AgentSession`
- **Default AI provider**: Azure OpenAI realtime models
- **Sandbox**: WebContainer running inside a dedicated Web Worker
- **Browser-agent bridge**: LiveKit Room RPC
- **Persistence**: minimal raw-event logging only

### Provider strategy

Azure is the default provider for MVP-1.

Recommended model mapping:

- **Primary live speech-to-speech model:** `gpt-realtime-2`
- **Optional transcription sidecar:** `gpt-realtime-whisper`
- **Deferred translation model:** `gpt-realtime-translate`
- **Non-realtime text tasks / later-phase summaries:** `gpt-chat-latest`

This keeps the live teaching loop on Azure while preserving a path for later summaries and memory tooling.

## Realtime voice architecture

### Chosen path

Use **LiveKit Agents 1.x `AgentSession`**, not deprecated `MultimodalAgent` examples.

Rationale:

- current supported LiveKit agent orchestration model
- works with realtime speech-to-speech setups
- better long-term compatibility with current LiveKit docs
- avoids implementing custom transport or direct browser-to-model realtime plumbing too early

### Voice path

1. Browser joins a LiveKit room.
2. User microphone audio is published to the room.
3. Agent service joins as a programmable participant.
4. Agent uses Azure realtime model (`gpt-realtime-2`) for low-latency speech in / speech out.
5. Agent audio is published back to the browser through LiveKit.

### Turn handling

Enable LiveKit adaptive interruption handling.

Design intent:

- RAMS should feel sharp, not jittery
- genuine interruptions should work
- incidental sounds / backchannels should not constantly cut the agent off

## Sandbox architecture

### Chosen path

Start with **WebContainer only** for MVP-1, running in a dedicated Web Worker.

Rationale:

- strongest fit for browser-based JavaScript / TypeScript exercises
- avoids immediate multi-runtime complexity
- proves the RPC inspection loop without adding Pyodide/package-resolution edge cases
- aligns with the fastest demo path

### Execution model

- editor state lives in the frontend
- source files are synchronized into the WebContainer virtual filesystem
- code execution occurs inside the sandbox worker
- execution results are normalized into a small state payload

### Sandbox state contract

The frontend must be able to return a bounded, structured snapshot to the agent, for example:

- active file path
- file contents for relevant files
- recent stdout / stderr
- last command run
- process exit code or running state
- error summary
- timestamp / turn identifier

The payload should stay intentionally small and bounded so RPC remains reliable.

## Browser-agent RPC bridge

### Chosen path

Use **LiveKit Room RPC** instead of custom data-channel message conventions.

### Flow

1. Browser registers RPC methods after room join.
2. Agent invokes RPC methods when it needs evidence from the sandbox.
3. Browser reads sandbox state from the worker.
4. Browser returns a structured result.
5. Agent uses the result to continue or interrupt the conversation.

### Initial RPC methods

The first version only needs a small set:

- `read_sandbox_state`
- `run_sandbox_command` (optional in MVP-1 if manual run button exists)
- `highlight_editor_range` (optional for UX polish; can defer)

MVP-1 can succeed with only `read_sandbox_state` if the user manually triggers code execution in the UI.

### Race-condition mitigation

Every RPC request/response should carry a session-local turn identifier.

If the user has moved to a new conversational turn before the response returns, the agent must treat the payload as potentially stale and avoid blindly injecting it into active reasoning.

This is required to prevent the “wrong code / wrong moment” failure mode described in the feasibility study.

## RAMS behavior design for MVP-1

### Desired behavior

RAMS is not a passive helper. In MVP-1 it should already display the core sparring character:

- ask the user to explain their reasoning
- inspect code or output when unsure
- challenge false claims
- redirect when logic is broken
- prefer evidence from sandbox state over flattery or generic encouragement

### Behavior constraints

To keep implementation tractable, MVP-1 RAMS should avoid:

- open-ended proactive outreach
- long multi-agent reasoning graphs
- autonomous curriculum scheduling
- broad memory retrieval pipelines

The first behavior layer is a tight teaching loop, not a full autonomous tutor OS.

## Persistence design

### MVP-1 persistence objective

Store enough structured data to support debugging, analytics, and future memory work.

### Persist now

- session metadata
- message transcript events
- agent RPC requests and responses
- sandbox execution summaries
- timestamps / turn IDs

### Defer

- nightly compaction
- semantic memory extraction
- vector pruning
- curriculum generation
- biological-memory mirroring mechanics

The persistence layer should be designed so future compaction can be added without rewriting the core live loop.

## Recommended deployment shape

### Frontend / edge

- browser app served from Cloudflare Pages or equivalent edge hosting
- token/session endpoints via Cloudflare Workers or similar thin API layer

### Agent service

- dedicated LiveKit agent service process
- configured against Azure OpenAI deployments
- joins rooms on demand and handles the live speech loop

### LiveKit

- LiveKit Cloud or existing managed deployment for MVP-1
- no need to self-host the SFU in the first slice unless credits/policy require it

## Non-goals and explicit deferrals

These are intentionally postponed so the implementation agent does not expand scope:

- no guest session links
- no pair programming rooms
- no shared editor presence
- no Pyodide in the first milestone unless browser runtime constraints force it
- no translation path using `gpt-realtime-translate`
- no `gpt-chat-latest` in the live audio path
- no long-term vector memory system in MVP-1
- no overnight cron-based memory compaction

## Risks and mitigations

### 1. LiveKit example drift

**Risk:** Implementation copies deprecated `MultimodalAgent` examples.

**Mitigation:** Standardize on `AgentSession` in the design and later plan.

### 2. Browser isolation / WebContainer headers

**Risk:** WebContainer fails because required isolation headers or browser constraints are not configured correctly.

**Mitigation:** Treat sandbox boot and health-check as an early milestone, not a late integration step.

### 3. RPC payload bloat

**Risk:** Sandbox responses become too large or noisy.

**Mitigation:** Define a strict bounded state contract and truncate logs aggressively.

### 4. RPC stale-state drift

**Risk:** Agent critiques stale code after the user has already moved on.

**Mitigation:** include turn IDs and reject stale responses from the active reasoning path.

### 5. Scope creep into memory/social features

**Risk:** implementation drifts toward the full platform instead of the proof loop.

**Mitigation:** keep MVP-1 acceptance criteria strictly tied to voice + sandbox RPC evidence loop.

## Acceptance criteria

MVP-1 is successful when all of the following are true:

1. user can open the app and join a live voice session
2. RAMS can speak back in real time using Azure as the default provider
3. user can edit and run JavaScript / TypeScript code in the browser sandbox
4. agent can request current sandbox state over LiveKit RPC
5. browser returns usable structured sandbox state to the agent
6. RAMS can respond using that state, not just transcript context
7. at least one demo flow shows RAMS catching a bad assumption or broken implementation based on live sandbox evidence
8. raw events are persisted for future memory-system iteration

## Demo scenario

A valid demo should look like this:

1. user joins the room
2. RAMS asks the user to implement a small function
3. user writes an incorrect implementation
4. user explains why they think it is correct
5. RAMS requests sandbox state
6. RAMS sees the actual code and/or failed output
7. RAMS challenges the user’s reasoning and guides the correction

If this works smoothly, the MVP proves the Soma thesis better than a generic chat demo.

## Chunk boundaries for planning

The implementation plan should be broken into separate chunk files for another agent to execute.

Recommended chunks:

1. **Chunk 1 — Repo/bootstrap architecture**
   - workspace shape
   - app/service boundaries
   - environment contract

2. **Chunk 2 — Frontend voice shell**
   - room join
   - microphone/audio UI
   - basic session page

3. **Chunk 3 — Azure-backed LiveKit agent service**
   - `AgentSession`
   - Azure realtime model wiring
   - voice behavior baseline

4. **Chunk 4 — Browser sandbox worker**
   - WebContainer boot
   - file sync
   - run / inspect primitives

5. **Chunk 5 — RPC bridge**
   - method registration
   - agent invocation
   - bounded payload contract
   - stale-turn protection

6. **Chunk 6 — RAMS teaching loop**
   - prompt / persona
   - inspect-then-challenge behavior
   - interruption tuning

7. **Chunk 7 — Persistence + end-to-end demo hardening**
   - event logging
   - integration testing
   - latency / reliability validation

## Final recommendation

Proceed with MVP-1 as a **single-user, Azure-default, LiveKit-based, WebContainer-first, evidence-driven teaching loop**.

This is the strongest low-scope proof of the Soma platform’s core idea and the cleanest handoff target for a separate implementation agent.
