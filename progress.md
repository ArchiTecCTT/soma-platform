# Progress

## Status
Completed browser sandbox, collaboration choices, and LiveKit-based multimodal voice mentor architecture research.

## Tasks
- [x] Research browser-side execution choices (WebContainer vs Pyodide vs defer-to-server)
- [x] Analyze worker isolation, security policies, and Document Isolation Policy
- [x] Evaluate RPC patterns (Comlink, postMessage, WS/WebRTC) for voice-to-sandbox sync
- [x] Compare CRDT engines (Yjs, Automerge) and SaaS sync platforms (Liveblocks)
- [x] Compile findings, MVP scope, and phased rollout strategy into research brief
- [x] Research LiveKit 1.x architectures, `AgentSession` migration, Room RPC, and Adaptive Interruption Handling for voice mentor MVP

## Files Changed
- `docs/research/2026-05-21-browser-sandbox-research.md` (Created)
- `docs/research/2026-05-21-livekit-research.md` (Created)

## Notes
- WebContainers are highly recommended for JS/TS due to zero infrastructure overhead and fast cold starts, but need COOP/COEP or Chrome 137's new Document Isolation Policy.
- Liveblocks with Yjs is the perfect MVP strategy to completely skip hosting websocket servers while unlocking multiplayer cursors and persistent comments.
- LiveKit Agents v1.0+ deprecated `MultimodalAgent` in favor of **`AgentSession`**; using Gemini Live via `AgentSession` with **Adaptive Interruption Handling** and **Room RPC** is the state-of-the-art MVP setup for a real-time voice mentor in 2026.
