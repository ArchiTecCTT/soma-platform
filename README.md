# The Soma Platform & RAMS
**The Autodidact Engine | An Adversarial, Proactive Learning Environment**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

[cite_start]The Soma Platform represents a fundamental architectural departure from traditional, passive conversational artificial intelligence frameworks[cite: 4]. [cite_start]It is engineered to function as an adversarial, proactive intellectual collaborative workspace, explicitly designed for self-directed builders, engineers, and polymaths[cite: 5].

The operational centerpiece of this environment is the **Rector Agentic Mentor System (RAMS)**. [cite_start]RAMS is not a subservient virtual assistant; it is a continuously running, stateful pedagogical engine that rigorously enforces active knowledge synthesis over passive consumption[cite: 6, 7].

---

## 🏛 Core Philosophical Mandates

### 1. The 90% Retention Mandate
[cite_start]Genuine cognitive retention can only be achieved through high-friction, constructive application of knowledge[cite: 9, 10]. [cite_start]Passive reading or listening is structurally penalized or blocked at the protocol level[cite: 11]. To progress through learning milestones, users must:
* [cite_start]Generate live physical artifacts (functional scripts, executable code, system blueprints) directly within browser-based sandboxes[cite: 12].
* [cite_start]Engage in verbal "Teach-Back" sessions, evaluated by RAMS through low-latency, multimodal assessment[cite: 13, 14].

### 2. The Non-Sycophantic Sparring Persona
[cite_start]Modern LLMs are heavily fine-tuned to be agreeable and excessively apologetic, which inherently degrades the pedagogical value of an intellectual sparring partner[cite: 16]. [cite_start]RAMS is systemically engineered to challenge false premises, proactively voice-interrupt broken logic mid-sentence, and stress-test algorithmic assumptions[cite: 17]. 

### 3. Biological Memory Mirroring & Zero-Prompt Proactivity
[cite_start]Rather than maintaining an infinite, unstructured context window that rapidly degrades reasoning capabilities, the system executes automated semantic memory compaction[cite: 20]. [cite_start]During overnight chronological cycles, the platform synthesizes raw conversational bloat into dense, long-term vector embeddings and relational database nodes[cite: 21]. [cite_start]RAMS does not wait for user invocation; it actively evaluates the user's historical state, generates personalized curricula, and initiates engagement via low-latency audio[cite: 22, 23].

### 4. Frictionless Social Ingress
[cite_start]External peers can instantly drop into a collaborative editor and shared WebRTC voice lounge via a simple hyperlink, entirely bypassing traditional onboarding friction and identity management bottlenecks[cite: 26].

---

## ⚙️ System Architecture (The Bootstrapped Blueprint)

[cite_start]The implementation is governed by a stringent bootstrapped constraint, utilizing a split edge-cloud topology to achieve near-$0 operational overhead[cite: 24, 25, 29].

### The Edge Tier (Cloudflare)
[cite_start]Operates exclusively on serverless edge networks for static hosting, metadata, and memory compaction[cite: 81, 186, 187].
* [cite_start]**Cloudflare Pages & Workers:** High-throughput routing, REST APIs, and static frontend hosting[cite: 188, 189].
* [cite_start]**Cloudflare D1 (SQLite) & Vectorize:** Stores relational session metadata and high-dimensional vector representations of semantic summaries[cite: 93, 94, 196, 197]. 
* [cite_start]**Cron Dispatchers & Queue Consumers:** Executes overnight biological memory compaction via Workers AI (`@cf/baai/bge-base-en-v1.5`), utilizing db.batch() statements and Cloudflare Queues to respect 15-minute execution limits and API constraints[cite: 91, 103, 112, 114].

### The Orchestration Tier (AWS)
[cite_start]Manages heavy WebRTC orchestration and stateful LangGraph pipelines running on frontier models[cite: 25].
* [cite_start]**LiveKit SFU (WebRTC to RTP):** Manages multi-party network topology with sub-10ms latency[cite: 40, 41].
* [cite_start]**Multimodal Bridge:** Utilizes the LiveKit `MultimodalAgent` class to bypass serial STT/TTS cascading, maintaining a direct, persistent WebSocket (WSS) connection to native multimodal endpoints (Gemini Live / OpenAI Realtime)[cite: 32, 34, 35, 36, 41].
* [cite_start]**LangGraph Cognitive Engine:** Acts as the stateful orchestrator, wrapped within a LiveKit `LLMAdapter` to translate message streams into conversational chunks[cite: 61, 62, 63].

### The Client-Side Execution Layer (Browser)
[cite_start]Code execution is pushed entirely to the edge to eliminate server compute costs and ensure absolute browser isolation[cite: 64, 77].
* [cite_start]**Isolated Sandboxes:** WebContainer API (Node.js) and Pyodide (Python) execute directly in the browser[cite: 57]. [cite_start]To prevent main-thread freezing and WebRTC disconnections, sandboxes run exclusively inside dedicated background Web Workers with aggressive watchdog termination[cite: 148, 149, 153, 154, 158].
* [cite_start]**State Sync via RPC:** LangGraph seamlessly intercepts audio streams and evaluates client-side sandbox data by triggering asynchronous LiveKit Remote Procedure Calls (e.g., `perform_rpc()`), preventing state drift via cryptographic turn IDs[cite: 58, 59, 68, 126, 127].
* **VAD Latency Masking:** A client-side Silero VAD WebAssembly module monitors the microphone. [cite_start]Upon detecting silence, it instantly plays randomized pre-recorded audio buffers ("Hmm," "Right") to completely mask network transit latency[cite: 46, 48, 205, 206].

---

## 📜 License & Usage (AGPL-3.0)

The Soma Platform and RAMS are released under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. 

This platform was built by and for self-directed hackers and engineers. You are entirely free to clone this repository, run it locally, tear it apart, and build upon it. 

However, if you modify this architecture and offer it as a managed service or SaaS to users over a network, you **must** release your modified source code under the exact same license. This ensures that infrastructure-level improvements are returned to the open-source community, preserving a fair, collaborative ecosystem. For commercial deployment without open-sourcing modifications, dual-licensing inquiries can be routed to the repository maintainers.
