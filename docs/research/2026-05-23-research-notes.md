# 2026-05-23 Research Notes

## Meta-Metadata and Strategy

- **Scope:** 200 architectural and technical implementation questions from `research-context.txt` covering SOMA (Questions 1-100) and RECTOR AI (Questions 1-100).
- **Execution mode:** Sequential batch preparation. 4 batches of 50 questions each, followed by validation and a single combined final document merge.
- **Freshness target:** Technical standards, API definitions, library versions, and platform features current to May 23, 2026.
- **Quality bar:** Focus on immediate implementability, avoiding theoretical abstractions. Every answer must specify real technologies, exact configuration settings, quantitative performance/scaling thresholds, clear trade-offs, and failure recoveries.
- **Output style:** Highly technical, direct, brief but dense, with an engineering-first vocabulary. No high-level or conversational filler.

---

## Answer Template

For each queried question, the answer must follow this strict structured schema:

```markdown
### Q[Number]. [Verbatim Question Text]

**Answer:** A concise 1-2 sentence core architectural or technical recommendation.

**Implement now:** Step-by-step description of the concrete integration design, schema layout, network topography, or message-flow pattern.

**Recommended stack:** A precise list of production-grade libraries, services, protocols, or compiler options (e.g., SQLite WAL mode, pgvector HNSW index, clickhouse-client, Firecracker jailer, ONNX Runtime Web, Yjs with y-websocket, NATS JetStream, OpenTelemetry).

**Why this over alternatives:** A quantitative and architectural contrast against competing approaches (e.g., why SQLite WAL + SQLCipher is preferred over a client-server PostgreSQL database for local-first state, or why WebContainers are chosen over remote VMs for low-latency browser sandboxes).

**Caveats / scale trigger:** Technical boundary conditions, hardware limitations, memory capacities, or concurrency limits that will trigger an architecture switch (e.g., "when database exceeds 10GB or concurrent users exceed 10,000, migrate vector tables from pgvector to ClickHouse").

**Sources:** Authoritative documentation links, specifications, standards papers, or engineering-blog references.
```

---

## Source Acceptance Criteria

### Preferred Sources (Descending Order of Authority)
1. **Official Specs & Vendor Docs:** Standard SQLite specifications, SQLCipher manuals, PostgreSQL core docs, ClickHouse reference manuals, Neo4j Graph algorithms reference, Firecracker microVM spec, WebContainers technical documents, Pyodide/Emscripten documentation, ONNX Runtime API specs, Redis streams/pub-sub manuals, NATS Core protocols, W3C standards (Service Workers, IndexedDB, postMessage).
2. **Maintainer Engineering Blogs:** Core tech blogs from Vercel, Supabase, Fly.io, Cloudflare, Zetetic (SQLCipher), Turso, ClickHouse, and Neo4j.
3. **Core Repository Issue Trackers & Discussion Boards:** Active GitHub issues, technical RFCs, and maintainer architectural discussions with deep-dive implementation detail.
4. **Reproducible Benchmarks:** High-quality, peer-reviewed engineering benchmarks showing clear memory/CPU footprints and throughput charts.

### Disallowed Sources
- Vague marketing/SEO fluff and aggregate blogs.
- Chatbot-generated generic answers lacking API or code-level specifics.
- Opinion-only opinion pieces lacking benchmarks or source code verification.
- Stale resources older than 2025 unless they remain the active canonical specification.

---

## Topic Buckets

- **Batch 1 (SOMA Q1-Q50):** 
  - Section 1: Unified SQL Gate & Core Data Architecture (Q1-Q10)
  - Section 2: Domain-Isolated Hybrid RAG (Q11-Q20)
  - Section 3: Knowledge Graph Engine & Relational Anchoring (Neo4j) (Q21-Q30)
  - Section 4: Code-as-an-Interface & Generative Visual Sandboxes (Q31-Q40)
  - Section 5: Secure Sandbox Execution (Firecracker MicroVMs) (Q41-Q50)
- **Batch 2 (SOMA Q51-Q100):**
  - Section 6: Polymathic Tool Integration (Notes, Brain Dumps, Plans) (Q51-Q60)
  - Section 7: Creative Output Engines (App Design, Writing, Complex Creation) (Q61-Q70)
  - Section 8: Sync, Local-First Architecture, and Deterministic Caching (Q71-Q80)
  - Section 9: Content Complexity Filtering & Load-Aware Query Optimization (Q81-Q90)
  - Section 10: Extensibility, Open Schemas & Long-Term Scaling (Q91-Q100)
- **Batch 3 (RECTOR Q1-Q50):**
  - Section 1: Edge Telemetry & Sensory Organs (Q1-Q10)
  - Section 2: The Continuous Heartbeat Daemon & State Matrix (Q11-Q20)
  - Section 3: Differentiable Inductive Logic Programming (∂ILP) (Q21-Q30)
  - Section 4: Non-Linear Curricular Routing & Cross-Domain Mapping (Q31-Q40)
  - Section 5: Local Learning Brain (SQLite Epistemic Engine) (Q41-Q50)
- **Batch 4 (RECTOR Q51-Q100):**
  - Section 6: Polymathic Retention & Spaced Cognitive Challenge (Q51-Q60)
  - Section 7: Initial Profiling & Cold-Start Data Gathering (Q61-Q70)
  - Section 8: Deterministic Router & Compute Gates (Go/Rust Backend) (Q71-Q80)
  - Section 9: The Cognitive Veto & Symbolic Integrity Layer (Q81-Q90)
  - Section 10: Human Alignment, Bias Mitigation & Long-Term Scaling (Q91-Q100)


## Completion Notes
- Four batches written and merged.
- Coverage validated for Q1-Q200.
- Final pass checked for numbering and weak-placeholder language.
- Remaining work, if any: user refinement based on preferred product direction.
