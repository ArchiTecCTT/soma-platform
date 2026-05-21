# Code Context: Soma Platform MVP Scouting Brief

## Files Retrieved
1. `README.md` (lines 1-114) - High-level architectural, philosophical, and conceptual baseline for Soma Platform & RAMS.
2. `docs/plans/Soma Platform & RAMS Feasibility Study.txt` (lines 1-208) - Exhaustive technical feasibility study, specifying protocol specifications, concrete edge-cases/vulnerabilities, detailed file structures, and a 5-phase deployment sequence.

---

## Key Code & Architecture Clues
While there is no active application source code implemented yet, the feasibility study details the precise structure and configuration boundaries:

### 1. AWS Orchestration Tier (Heavy Compute)
- **`agent_service/` (Python LiveKit Worker)**
  - `main.py`: Binds to LiveKit Room, orchestrates the worker processes.
  - `multimodal_bridge.py`: Manages the direct `MultimodalAgent` WebSocket connection to Gemini Live or OpenAI Realtime.
  - `interruption_handler.py`: Implements Adaptive Interruption Handling to filter non-lexical filler words and handle `handle.interrupt()`.
  - `rpc_controller.py`: Executes outward client calls via `room.local_participant.perform_rpc()`.
- **`cognitive_engine/` (LangGraph)**
  - `supervisor.py`: Core LangGraph state machine. Defines the "Non-Sycophantic" sparring vs Socratic persona.
  - `tools.py`: Connects LangGraph to `rpc_controller.py` for sandbox interrogation (e.g., `read_sandbox_state`).
  - `adapter.py`: Wraps LangGraph streams using `LLMAdapter` to translate messages into conversational voice chunks.

### 2. Cloudflare Edge Tier (Static Hosting, Metadata, & Compaction)
- **`cloudflare-workers/` (Edge Workers)**
  - `api_gateway.ts`: Handles session tokens and auth.
  - `social_ingress.ts`: Issues transient room tokens for dropping in via hyperlinks.
  - `cron_dispatcher.ts`: Scheduled overnight worker running on `0 3 * * *` to dispatch compaction queue items.
  - `memory_compactor.ts`: Pulls queue jobs, generates embeddings, and inserts them into Cloudflare Vectorize.
- **`data_layer/`**
  - `schema.sql`: D1 SQLite relational schema (users, sessions, transcripts, memory nodes).
  - `vectorize_client.ts`: Manages vector embeddings with batched upserts.

### 3. Client-Side Browser Application (WebRTC Client & Sandboxes)
- **`components/`**
  - `VoiceLounge.tsx`: React client using `@livekit/components-react`.
  - `LatencyMask.tsx`: Browser Silero VAD WASM module playing local back-channels ("Hmm", "Right") to mask network delay.
  - `CodeEditor.tsx`: Monaco editor sync'd with Yjs/LiveKit DataChannels.
- **`sandbox/`**
  - `SandboxWorker.ts`: Separate Web Worker isolating Pyodide and WebContainer runtimes from the main rendering thread.
  - `RpcListener.ts`: Pre-registers `room.registerRpcMethod('read_sandbox_state')` to serialize local state and send it back over WebRTC.

---

## Architectural Data Flow
1. **User Voice Input** -> Browser WebRTC (UDP) -> LiveKit SFU -> Python Agent -> Multimodal Bridge -> Frontier Model (WebSocket WSS).
2. **Pedagogical Interrogation** -> LangGraph Supervisor determines milestone validation is needed -> Invokes `read_sandbox_state` tool -> Python Worker triggers `room.local_participant.perform_rpc()` -> Client WebContainer/Pyodide Web Worker evaluates state -> Standard output returned via RPC response -> Injected into LangGraph context.
3. **Overnight Compaction** -> Cloudflare Cron trigger (3:00 AM) -> Pulls logs from D1 -> Summarizes via Workers AI -> Generates embeddings via `@cf/baai/bge-base-en-v1.5` -> Saves to Cloudflare Vectorize.

---

## Risky Assumptions & Critical Vulnerabilities

1. **RPC State Drift / Race Condition**: User keeps speaking while server waits for async client sandbox execution.
   - *Mitigation*: Cryptographic `turn_id` / context tagging. Ignore returns if turn has advanced, redirecting them to background memory queue.
2. **D1 & Vectorize Rate Limiting / Timeout**: 15-minute execution limit on Cloudflare Cron triggers and batch parameters limits (D1 binds <= 100 parameters; Vectorize batch upsert <= 1000).
   - *Mitigation*: Chunk insertion arrays using `db.batch()`, push jobs to Cloudflare Queues parallel workers, and use Cloudflare KV as a periodic intermediate upload cache instead of one single overnight batch dump.
3. **Wasm Thread Freeze (Main Thread Blocking)**: Heavy Node/Python compilation in WebContainer/Pyodide freezes browser WebRTC main thread, causing disconnects.
   - *Mitigation*: Absolute isolation of compilation runtimes within Web Workers; communicate with main thread via `postMessage()`; implement a 5-second watchdog timer on the main thread to terminate and reboot the worker on timeout.

---

## Candidate Chunk Boundaries (Implementation Roadmap)

Based on the validated Feasibility Study, implementation should proceed in these modular phases:

- **Chunk 1: LiveKit WebRTC Transport & Multimodal Bridge (Phase 1 Baseline)**
  - Establish LiveKit SFU room connection.
  - Deploy basic Python worker on AWS EC2/ECS implementing `MultimodalAgent`.
  - Verify ultra-low latency voice-to-voice stream with Gemini/OpenAI Realtime.
- **Chunk 2: Isolated Client Sandboxing & WebRTC RPC (Phase 2 Integration)**
  - Establish Pyodide and WebContainer integration in isolated Client Web Workers.
  - Implement bidirectional RPC: client registering `read_sandbox_state` and python worker invoking it.
- **Chunk 3: LangGraph Cognitive Supervisor & Interruption Handler (Phase 3 Semantics)**
  - Integrate LangGraph state machine, Socratic prompts, and the `LLMAdapter` streaming bridge.
  - Configure LiveKit's Adaptive Interruption Handling mode to prevent jittery speech cuts.
- **Chunk 4: Serverless Memory Compactor & Cron Automation (Phase 4 Edge Memory)**
  - Configure D1 schemas, Vectorize indexes, and Cloudflare Queue structure.
  - Implement the `cron_dispatcher.ts` and `memory_compactor.ts` Workers utilizing Workers AI embeddings.
- **Chunk 5: Social Drop-In & Client latency-masking (Phase 5 Ingress/UI)**
  - Build Silero VAD WebAssembly masking component.
  - Build Cloudflare Workers unauthenticated transient link token dispatching.

---

## Start Here
To begin coding the MVP, the very first files to create and implement are:
1. **`agent_service/main.py`** & **`agent_service/multimodal_bridge.py`** on AWS to verify transport loop.
2. **`components/VoiceLounge.tsx`** on the client to initiate the WebRTC handshake.
