# Prompt for the implementation agent

Use this prompt with the separate implementation agent.

---

You are implementing **Soma MVP-1** in this repository using **subagent-driven development**.

## Required workflow

1. Use **superpowers:subagent-driven-development** as the primary execution mode.
2. Execute the plan files in order:
   - `docs/superpowers/specs/2026-05-21-soma-mvp1-voice-sandbox-rpc-design.md`
   - `docs/superpowers/plans/2026-05-21-soma-mvp1/00-overview.md`
   - `docs/superpowers/plans/2026-05-21-soma-mvp1/01-foundation-and-web-shell.md`
   - `docs/superpowers/plans/2026-05-21-soma-mvp1/02-agent-service-azure-realtime.md`
   - `docs/superpowers/plans/2026-05-21-soma-mvp1/03-browser-sandbox-and-rpc.md`
   - `docs/superpowers/plans/2026-05-21-soma-mvp1/04-persistence-hardening-and-demo.md`
3. For each task in each chunk:
   - dispatch a fresh implementer subagent
   - run spec-compliance review
   - run code-quality review
   - fix findings before moving on
4. Do **not** stop to ask the human whether to continue between normal tasks. Only stop if genuinely blocked or if the plan/spec is ambiguous in a way that prevents safe implementation.

## Product constraints

- Build only the approved **MVP-1** slice:
  - single-user voice session
  - LiveKit transport
  - Azure as default provider
  - `gpt-realtime-2` as the main realtime speech model
  - optional `gpt-realtime-whisper` sidecar support
  - browser WebContainer sandbox on the main thread via SandboxClient
  - LiveKit Room RPC bridge for sandbox inspection
  - raw event persistence only
- Use **LiveKit Agents 1.x `AgentSession`**.
- Do **not** use deprecated `MultimodalAgent` examples.

## Non-goals

Do **not** add:
- guest links
- multiplayer collaboration
- Pyodide unless truly blocked by WebContainer limits
- long-term memory compaction
- proactive curriculum generation
- translation workflows
- `gpt-chat-latest` in the live audio path

## Engineering constraints

- Keep the repo as a `pnpm` TypeScript monorepo.
- Prefer small, focused files.
- Follow the exact file paths in the plan unless a review discovers a correctness issue.
- Run the verification commands listed in each chunk.
- Keep commits small and aligned with the chunk tasks.

## Definition of done

The implementation is done only when:
- `pnpm check` passes
- `pnpm test` passes
- the manual smoke flow in `docs/demo/voice-sandbox-rpc-smoke.md` is satisfied
- the browser can join a room
- the sandbox can run code
- the agent can inspect sandbox state over RPC
- raw JSONL events are written to `data/session-events/`

## Reporting format

When you finish, return:
1. completed chunks/tasks
2. files changed
3. commands run and results
4. any deviations from the plan and why
5. any remaining risks or manual follow-ups

Start by reading the spec and overview, then execute chunk 1.
