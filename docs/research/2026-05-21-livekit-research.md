# Research: LiveKit-Based Multimodal Voice Mentor Architecture (May 2026)

## Summary
The recommended architecture for a low-latency, real-time voice mentor utilizes **LiveKit Agents 1.x** with the unified **`AgentSession`** orchestrator, entirely replacing the deprecated `MultimodalAgent` and `VoicePipelineAgent` classes. This architecture integrates speech-to-speech (S2S) capabilities from Gemini Live or OpenAI Realtime APIs over WebRTC, using built-in ML-based **Adaptive Interruption Handling** to filter non-interruptive vocal backchannels (e.g., "mm-hmm"). High-reliability synchronization between the voice agent and the browser-based learning environment is achieved through **LiveKit Room RPC**, enabling bidirectional method invocation with zero extra transport infrastructure.

## Findings

1. **Deprecation of MultimodalAgent in Favor of AgentSession**
   In the LiveKit Agents 1.x framework, the previous `MultimodalAgent` and `VoicePipelineAgent` classes have been fully deprecated and unified into a single class: **`AgentSession`**. This unified class manages both streaming cascade pipelines (STT + LLM + TTS) and native multimodal/real-time APIs (OpenAI Realtime and Gemini Live) under one orchestrator, making it easier to switch models without rewrites. 
   - [Source: Agents v0.x migration guide](https://docs.livekit.io/reference/migration-guides/v0-migration/nodejs.md)
   - [Source: AgentSession API Docs](https://docs.livekit.io/reference/agents-js/classes/agents.voice.AgentSession.html)

2. **Adaptive Interruption Handling & Turn Detection**
   LiveKit version `1.5.0` introduced an ML-based **Adaptive Interruption Handling** classifier within the `turn_handling` options. Traditional Voice Activity Detection (VAD) naively stops an agent's speech at any user-generated sound, ruining conversational flow due to coughs, laughs, or backchanneling ("uh-huh", "mm-hmm"). The new ML model resolves this with 86% precision, rejecting 51% of false interruptions while speeding up true interruption detection by 64%. It is configured via `TurnHandlingOptions` and `InterruptionOptions` in the agent's initialization.
   - [Source: Solving unwanted interruptions with Adaptive Interruption Handling](https://livekit.com/blog/adaptive-interruption-handling)
   - [Source: Turn Handling Options](https://docs.livekit.io/reference/agents/turn-handling-options.md)

3. **Room RPC for Bidirectional Browser-Agent Synchronization**
   Synchronizing the agent's vocal track with UI states (e.g., displaying a flashcard, showing a visual highlight, triggering browser actions) is best handled by **LiveKit Room RPC**. Introduced in late 2025/early 2026, Room RPC allows a participant (e.g., the local participant in the browser) to register methods using `registerRpcMethod()` and another participant (the Python/Node Agent) to invoke them using `performRpc()`. This replaces flaky, custom JSON payloads over data channels with structured request-response patterns, strict timeouts, and serialized error reporting.
   - [Source: LiveKit Remote Method Calls (RPC)](https://docs.livekit.io/transport/data/rpc/)
   - [Source: LiveKit Python SDK RPC Example](https://github.com/livekit/python-sdks/blob/main/examples/rpc.py)

4. **Latency Expectations (Speech-to-Speech vs Cascade)**
   Native speech-to-speech engines (OpenAI Realtime, Gemini 3.1 Flash Live) completely bypass the cascading pipeline latency of discrete STT -> LLM -> TTS steps. In production 2026 setups, cascading pipelines hover around a 600ms–800ms Time-to-First-Audio (TTFA). S2S engines achieve a **300ms–500ms end-to-end latency**, matching phone-call-grade responsiveness. However, S2S is single-provider locked and substantially more expensive than pipeline-based options (Gemini Live is currently the most cost-effective S2S at ~$0.018/min output).
   - [Source: Voice AI Latency Benchmarks 2026](https://tokenmix.ai/blog/voice-ai-api-realtime-vs-gemini-live-vs-elevenlabs-2026)
   - [Source: LiveKit Agent Production Monitoring Metrics](https://hamming.ai/resources/livekit-agent-monitoring-prometheus-grafana-alerts)

5. **Recommended MVP Architecture Shape**
   - **Agent Runtime**: Python-based LiveKit Agent running `livekit-agents >= 1.5.0`.
   - **AI Engine**: **Gemini 1.5 Flash Live** (via `livekit-plugins-gemini`), chosen for its superior speed-to-cost ratio ($0.018/min vs OpenAI's high Realtime cost), massive context window, and native multimodal vision capabilities.
   - **Frontend Integration**: JS/React client utilizing the `livekit-client` JS SDK, registering local RPC methods (e.g., `show_concept`, `update_workspace`) that the agent calls dynamically during Socratic instruction.
   - **Interruption Strategy**: Enable `adaptive` interruption handling with Silero VAD configured for a 500ms overlap grace period to ensure highly natural conversations.

---

## Sources

### Kept
- **LiveKit Agents v0.x to 1.0 Migration Guide** (https://docs.livekit.io/reference/migration-guides/v0-migration/nodejs.md) — Critical for highlighting the complete deprecation of `MultimodalAgent`/`VoicePipelineAgent` in favor of `AgentSession`.
- **LiveKit Adaptive Interruption Blog & Release notes** (https://livekit.com/blog/adaptive-interruption-handling) — Details the exact performance, capabilities, and parameters of the 2026 ML-based turn-taking model.
- **LiveKit Room RPC Documentation & Examples** (https://docs.livekit.io/transport/data/rpc/) — Authoritative specifications for establishing clean, bidirectional synchronization between the browser client and Python agent.
- **TokenMix Voice AI Latency Comparison 2026** (https://tokenmix.ai/blog/voice-ai-api-realtime-vs-gemini-live-vs-elevenlabs-2026) — Provides the most up-to-date benchmarks comparing OpenAI Realtime, Gemini Live, and cascading pipelines.

### Dropped
- **Legacy Medium and Blog Posts on v0.x Pipelines** — Excluded because they focus entirely on deprecated v0.x constructs and cascade architectures, which do not reflect 2026 best practices.

---

## Gaps & Next Steps

1. **Visual Pipeline Sync**: While Gemini Live supports real-time video inputs (Live Vision), sending browser canvas states / code-editor buffers back to the model continuously can be cost-prohibitive. 
   - *Next Step*: Prototype a "hybrid" model where code context is sent via Room RPC payloads on modification, while the user's camera uses the WebRTC video stream.
2. **Telemetry & Guardrails**: Standard LLM guardrails (like LlamaGuard) introduce critical latency penalties (adding 100-200ms) on real-time speech streams.
   - *Next Step*: Evaluate asynchronous, out-of-band monitoring or native safety configurations on the model level.
