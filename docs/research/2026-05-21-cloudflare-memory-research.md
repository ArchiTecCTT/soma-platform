# Research: Cloudflare-Based Memory & Proactivity Infrastructure (2026)

## Summary
The optimal architecture for Cloudflare-based memory/proactivity infrastructure as of mid-2026 utilizes a hybrid approach: **Durable Objects (DO) with SQLite** or the newly released **Cloudflare Agents SDK (featuring the experimental Session API)** for isolated, stateful, near-real-time user conversation threads, paired with **D1** for relational cross-user reporting/long-term archival and **Vectorize** for sub-millisecond edge similarity search. For an MVP, overnight memory compaction should be **deferred** in favor of lightweight, inline, sliding-window summarization or native Session-level compaction to bypass the operational complexity of distributed cron-triggered orchestration.

---

## Findings

### 1. Cloudflare Workers: Runtime Limits & Memory Best Practices
* **RAM Limit**: Workers maintain a strict physical limit of **128 MB of memory per isolate** on both Free and Paid plans. Navigating this requires strict context hygiene. Attempting to buffer an entire LLM response or large document payloads using `await response.text()` or `await request.arrayBuffer()` will immediately crash the isolate with an Out Of Memory (OOM) error.
* **Streaming is Mandatory**: Best practice dictates streaming all inbound and outbound requests and responses chunk-by-chunk using `TransformStream` to keep the memory footprint constant and flat.
* **CPU Execution Limits**: Default Worker HTTP invocations are limited to **30 seconds** of CPU time (Paid plan, default) or up to **5 minutes** on custom Paid request configurations. If an operation requires extensive synchronous computation, it must be offloaded to Queues or Cron Triggers where execution time is granted up to **15 minutes**.
* *Source*: [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers Best Practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

### 2. D1 Relational Storage: Scale-out Database Sharding
* **Horizontal Architecture**: Cloudflare D1 databases are designed for horizontal scale-out rather than massive vertical structures. Individual databases on the Workers Paid plan are limited to **10 GB** (500 MB on the Free plan), with a cap of **50,000 databases per account**.
* **Per-Entity Databases**: The recommended architectural pattern is to spin up **per-user or per-tenant D1 databases**. This mitigates cross-tenant data leakage, guarantees fast individual backups via D1's Point-in-Time recovery (Time Travel - 30 days history on Paid), and keeps individual databases well under the 10 GB threshold.
* **Network & Query Overhead**: D1 is not an in-process SQLite engine; queries represent network subrequests (adding 5-50ms latency). Subrequests are capped at **1000 per Worker invocation** (Paid) and **50 per Worker invocation** (Free). To optimize, developers must utilize prepared statements and batched queries (`db.batch()`) to aggregate transactions into a single network round-trip.
* *Source*: [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)

### 3. Vectorize: High-Density Edge RAG
* **Increased Vector Limits**: As of January 23, 2026, Vectorize indexes on Workers Paid plans support up to **10 million vectors** per single index (doubled from the previous limit) and up to **50,000 indexes per account**.
* **Query and Metadata Specifications**: Vectorize supports up to **1536 dimensions** with 32-bit float precision. Up to **10 KiB of metadata** can be attached to each vector.
* **Enhanced Retrieval**: As of March 2026, the `topK` parameter has been increased to return up to **50 query matches** when requesting full vector values or complete metadata (`returnValues: true` or `returnMetadata: "all"`), up from the previous limit of 20, providing much richer context windows for RAG models.
* *Source*: [Cloudflare Vectorize Limits](https://developers.cloudflare.com/vectorize/platform/limits/), [Vectorize 10M Capacity Changelog](https://developers.cloudflare.com/changelog/post/2026-01-23-increased-index-capacity/), [Vectorize topK Update](https://developers.cloudflare.com/changelog/product/vectorize/)

### 4. Cloudflare Queues: Decoupling and Async Throughput
* **Limits**: Cloudflare Queues support messages up to **128 KB** in size, with up to **10,000 queues per account**. Per-queue throughput is capped at **5,000 messages per second**.
* **Asynchronous Offloading**: Queues are highly efficient for decoupling memory ingestion from critical user-facing loops. Writing a user interaction event to a Queue costs minimal latency, allowing background consumer Workers (which have a extended **15-minute CPU ceiling**) to perform embedding generations and Vectorize upserts asynchronously.
* *Source*: [Cloudflare Queues Limits](https://developers.cloudflare.com/queues/platform/limits/), [Queues Pricing](https://developers.cloudflare.com/queues/platform/pricing/)

### 5. Emerging 2026 Standard: Cloudflare Agents SDK & DO SQLite
* **Actor-Model Execution**: The Cloudflare Agents SDK (introduced in late 2025/early 2026) operates on top of **SQLite-backed Durable Objects**. It provides persistent, stateful micro-servers for each individual agent (e.g., one agent per user) with their own embedded SQLite database and WebSocket support.
* **The Session API**: Under `agents/experimental/memory/session`, the SDK offers a dedicated Session model with tree-structured message histories, context block injection, automatic full-text search, and **built-in context compaction**.
* **Agent Memory Service**: Launched in private beta in April 2026, Cloudflare's managed **Agent Memory** automatically extracts persistent facts, instructions, tasks, and historical summaries during the compaction phase, storing them in profile-specific layers and serving them back to models on-demand, preventing context rot and saving prompt tokens.
* *Source*: [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/), [Sessions API Docs](https://developers.cloudflare.com/agents/api-reference/sessions/), [Agent Memory Blog Announcement](https://blog.cloudflare.com/introducing-agent-memory/)

---

## Recommended MVP Architecture

To balance delivery speed and operational overhead, the following **two-tier memory architecture** is recommended for the MVP:

```
[ User UI / Client ]
        │ (WebSocket / HTTP Stream)
        ▼
[ Cloudflare Workers / Pages ]
   ├── Writes Raw Chat Events ──► [ Cloudflare Queues ]
   │                                     │ (Async Consumer - 15m CPU)
   │                                     ▼
   │                              1. Generate Embeddings (Workers AI)
   │                              2. Save to D1 (User Archival)
   │                              3. Upsert to Vectorize (RAG index)
   ▼
[ Active Session Cache ]
  - Sliding-window context in memory (10-15 turn limit)
  - Semantic RAG lookup from Vectorize to augment prompts
```

### Components of the MVP:
1. **Edge Router (Pages/Workers)**: Handles incoming client streams, parses message structures, and coordinates active prompt injection.
2. **Decoupled Queue (Queues)**: Receives raw transaction events. This isolates the user-facing thread from downstream API and LLM latencies.
3. **Database Layer (D1)**: Stores conversation logs horizontally. Create a single D1 database for user interactions, relying on standard tables (`conversations`, `messages`, `metadata`).
4. **Vector Database (Vectorize)**: Stores raw chunk embeddings (e.g., 384-dimension or 1536-dimension vectors) mapped to specific message IDs.
5. **Real-time RAG**: Before invoking the main LLM, query Vectorize using the current user query (`topK: 5`) to pull in relevant historical facts.

---

## Overnight Memory Compaction: Build Now vs. Defer

### **Decision: DEFER to Post-MVP**

| Aspect | Inline/Sliding-Window Compaction (MVP) | Overnight Cron-Based Compaction (Post-MVP) |
|---|---|---|
| **Mechanism** | Maintain a sliding window of the last 10 messages in active memory. Prune older turns or run a quick, lightweight summarization when thread length is exceeded. | A scheduled Cron worker boots at 2:00 AM, queries D1 for the day's messages, calls a high-quality LLM to consolidate memories, updates Vectorize, and deletes raw text. |
| **Complexity** | **Very Low**: Controlled in code with simple array slice operations or native `Session` configuration. | **High**: Requires configuring Cron Triggers, cross-referencing multi-database D1 endpoints, and managing distributed concurrency limits. |
| **Cost** | Minimal edge CPU execution overhead. | Significant model token cost (analyzing entire raw histories) and D1 write-rate cost. |
| **Failure Modes** | Minor context loss of immediate adjacent history. | Cron job timeouts, race conditions with active late-night sessions, or database locking during bulk deletes. |

### Post-MVP Implementation Path:
Once the product moves beyond MVP:
1. Use **Cloudflare Cron Triggers** to execute a nightly maintenance script.
2. The Cron Worker reads uncompacted events from the user's **D1** instance.
3. Pass raw transcripts to an LLM (e.g., using Workers AI or external APIs) to extract **facts**, **unresolved tasks**, and **superseded context**.
4. Update the user's long-term **Vectorize** index with the new summaries, pruning old redundant vectors.
5. If the **Cloudflare Agents SDK** and its **Agent Memory** service have graduated to general availability by then, migrate the entire stateful layer to SQLite-backed Durable Objects + Agent Memory, offloading the compaction engineering fully to Cloudflare's managed service.

---

## Cost & Risk Analysis

| Resource | Primary MVP Risks | Mitigation Strategy |
|---|---|---|
| **Workers Isolates** | OOM crashes due to buffering massive texts (>128 MB RAM limit). | Force strict streaming. Enforce maximum payload limits (e.g., max 2MB payloads) before consuming JSON bodies. |
| **D1 Databases** | 10 GB storage limits per database and subrequest throttling (1000/request). | Design a clean sharding strategy (e.g., one D1 database per tenant) or keep database schemas strictly normalized. Maximize batching operations (`db.batch`). |
| **Vectorize** | Running out of available indexes on the Paid plan (50,000 index limit). | Instead of spinning up one separate index per user, use **Vectorize Namespaces**. One master index can store millions of vectors, using the user ID as a namespace to partition queries safely. |
| **Cloudflare Queues** | Message payload exceeding the 128 KB queue limit. | Never place large raw texts or PDFs in the queue payload. Instead, save the raw text to KV or R2, and pass only the object key/ID in the queue message. |

---

## Sources
* **D1 Limits**: [https://developers.cloudflare.com/d1/platform/limits/](https://developers.cloudflare.com/d1/platform/limits/)
* **Vectorize Limits**: [https://developers.cloudflare.com/vectorize/platform/limits/](https://developers.cloudflare.com/vectorize/platform/limits/)
* **Workers Limits**: [https://developers.cloudflare.com/workers/platform/limits/](https://developers.cloudflare.com/workers/platform/limits/)
* **Queues Limits**: [https://developers.cloudflare.com/queues/platform/limits/](https://developers.cloudflare.com/queues/platform/limits/)
* **Durable Objects limits**: [https://developers.cloudflare.com/durable-objects/platform/limits/](https://developers.cloudflare.com/durable-objects/platform/limits/)
* **Cloudflare Agents SDK Sessions**: [https://developers.cloudflare.com/agents/api-reference/sessions/](https://developers.cloudflare.com/agents/api-reference/sessions/)
* **Agent Memory Service**: [https://blog.cloudflare.com/introducing-agent-memory/](https://blog.cloudflare.com/introducing-agent-memory/)

---

## Gaps
1. **Agent Memory Service Availability**: Cloudflare's "Agent Memory" service is in private beta as of April 2026. Pricing structures and concrete SLA/general availability dates remain unannounced, making it a risk for early production dependency.
2. **Durable Objects SQLite Storage Cost**: SQLite-backed Durable Objects started billing in early 2026. High-volume write and storage requirements across tens of thousands of users need exact unit cost validation.
