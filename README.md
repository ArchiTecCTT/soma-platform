# The Soma Platform & RAMS
**The Autodidact Engine | An Adversarial, Proactive Learning Environment**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

The Soma Platform represents a fundamental architectural departure from traditional, passive conversational artificial intelligence frameworks. It is engineered to function as an adversarial, proactive intellectual collaborative workspace, explicitly designed for self-directed builders, engineers, and polymaths.

The operational centerpiece of this environment is the **Rector Agentic Mentor System (RAMS)**. RAMS is not a subservient virtual assistant; it is a continuously running, stateful pedagogical engine that rigorously enforces active knowledge synthesis over passive consumption.

---

## Local MVP-1 services

- `pnpm dev` — starts API, web shell, and LiveKit worker together
- `pnpm dev:api` — starts the token API on `http://localhost:8787`
- `pnpm dev:web` — starts the browser shell
- `pnpm dev:agent` — starts the LiveKit worker with Azure realtime defaults

### Agent mode / model env knobs

```env
MENTOR_MODE=technical
AZURE_OPENAI_REALTIME_DEPLOYMENT=gpt-realtime-mini
AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT=gpt-realtime-whisper
OPENAI_API_VERSION=2025-04-01-preview
```

- `MENTOR_MODE=technical` → RAMS uses sandbox inspection for code claims
- `MENTOR_MODE=philosophy` → RAMS becomes a philosophy mentor and does **not** register sandbox tools
- Default realtime deployment is now `gpt-realtime-mini`


---

## MVP-1 verification
- `pnpm check`
- `pnpm test`
- Follow `docs/demo/voice-sandbox-rpc-smoke.md`

---

## 🏛 Core Philosophical Mandates

### 1. The 90% Retention Mandate
Genuine cognitive retention can only be achieved through high-friction, constructive application of knowledge. Passive reading or listening is structurally penalized or blocked at the protocol level. To progress through learning milestones, users must:
* Generate live physical artifacts (functional scripts, executable code, system blueprints) directly within browser-based sandboxes.
* Engage in verbal "Teach-Back" sessions, evaluated by RAMS through low-latency, multimodal assessment.

### 2. The Non-Sycophantic Sparring Persona
Modern LLMs are heavily fine-tuned to be agreeable and excessively apologetic, which inherently degrades the pedagogical value of an intellectual sparring partner. RAMS is systemically engineered to challenge false premises, proactively voice-interrupt broken logic mid-sentence, and stress-test algorithmic assumptions. 

### 3. Biological Memory Mirroring & Zero-Prompt Proactivity
Rather than maintaining an infinite, unstructured context window that rapidly degrades reasoning capabilities, the system executes automated semantic memory compaction. During overnight chronological cycles, the platform synthesizes raw conversational bloat into dense, long-term vector embeddings and relational database nodes. RAMS does not wait for user invocation; it actively evaluates the user's historical state, generates personalized curricula, and initiates engagement via low-latency audio.

### 4. Frictionless Social Ingress
External peers can instantly drop into a collaborative editor and shared WebRTC voice lounge via a simple hyperlink, entirely bypassing traditional onboarding friction and identity management bottlenecks.

---

## ⚙️ System Architecture (The Bootstrapped Blueprint)

The implementation is governed by a stringent bootstrapped constraint, utilizing a split edge-cloud topology to achieve near-$0 operational overhead.

### The Edge Tier (Cloudflare)
Operates exclusively on serverless edge networks for static hosting, metadata, and memory compaction.
* **Cloudflare Pages & Workers:** High-throughput routing, REST APIs, and static frontend hosting.
* **Cloudflare D1 (SQLite) & Vectorize:** Stores relational session metadata and high-dimensional vector representations of semantic summaries. 
* **Cron Dispatchers & Queue Consumers:** Executes overnight biological memory compaction via Workers AI (`@cf/baai/bge-base-en-v1.5`), utilizing db.batch() statements and Cloudflare Queues to respect 15-minute execution limits and API constraints.

### The Orchestration Tier (AWS)
Manages heavy WebRTC orchestration and stateful LangGraph pipelines running on frontier models.
* **LiveKit SFU (WebRTC to RTP):** Manages multi-party network topology with sub-10ms latency.
* **Multimodal Bridge:** Utilizes the LiveKit `MultimodalAgent` class to bypass serial STT/TTS cascading, maintaining a direct, persistent WebSocket (WSS) connection to native multimodal endpoints (Gemini Live / OpenAI Realtime).
* **LangGraph Cognitive Engine:** Acts as the stateful orchestrator, wrapped within a LiveKit `LLMAdapter` to translate message streams into conversational chunks.

### The Client-Side Execution Layer (Browser)
Code execution is pushed entirely to the edge to eliminate server compute costs and ensure absolute browser isolation.
* **Isolated Sandboxes:** WebContainer API (Node.js) and Pyodide (Python) execute directly in the browser. To prevent main-thread freezing and WebRTC disconnections, sandboxes run exclusively inside dedicated background Web Workers with aggressive watchdog termination.
* **State Sync via RPC:** LangGraph seamlessly intercepts audio streams and evaluates client-side sandbox data by triggering asynchronous LiveKit Remote Procedure Calls (e.g., `perform_rpc()`), preventing state drift via cryptographic turn IDs.
* **VAD Latency Masking:** A client-side Silero VAD WebAssembly module monitors the microphone. Upon detecting silence, it instantly plays randomized pre-recorded audio buffers ("Hmm," "Right") to completely mask network transit latency.

---

## 📜 License & Usage (AGPL-3.0)

The Soma Platform and RAMS are released under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. 

This platform was built by and for self-directed hackers and engineers. You are entirely free to clone this repository, run it locally, tear it apart, and build upon it. 

However, if you modify this architecture and offer it as a managed service or SaaS to users over a network, you **must** release your modified source code under the exact same license. This ensures that infrastructure-level improvements are returned to the open-source community, preserving a fair, collaborative ecosystem. For commercial deployment without open-sourcing modifications, dual-licensing inquiries can be routed to the repository maintainers.
