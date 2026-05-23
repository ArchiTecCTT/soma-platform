# 2026-05-23 Source Register

This register identifies the authoritative documentation, specifications, and reference materials utilized to ensure the SOMA + RECTOR architecture answers are technically concrete, implementable, and accurate to the state of the industry as of May 23, 2026.

---

## Technical Domain Scaffold

### Core platform architecture
- [ ] **SQLite / SQLCipher / LiteFS / CRDT docs**
  - WAL mode, connection pooling, multi-threading flags, SQLCipher page-level encryption, LiteFS distributed consensus replication, Yjs/Automerge delta encoding.
- [ ] **Postgres / pgvector / ClickHouse docs**
  - pgvector HNSW vs IVFFlat memory trade-offs, clickhouse-client bulk ingestion streaming, PostgreSQL row-level security (RLS) schemas.
- [ ] **Neo4j / graph modeling / graph algorithms docs**
  - PageRank, Centrality algorithms, multi-hop Cypher queries, transactional veto architectures, memory caching parameters.
- [ ] **WebContainers / Pyodide / sandbox docs**
  - In-browser file system mounting, service worker network proxying, Pyodide WASM runtime memory caps.
- [ ] **Firecracker / E2B / isolation docs**
  - Jailer cgroups isolation, minimal VM kernels, warm microVM snapshot resume patterns, secure postMessage frames.
- [ ] **ONNX Runtime / rerankers / quantization docs**
  - ONNX Runtime Web INT8 execution, Cross-Encoder reranker latencies, vocabulary token diversity metrics.
- [ ] **Redis / NATS / queueing docs**
  - Redis Streams polling frequencies, memory lockless structures, NATS JetStream pub-sub.
- [ ] **OpenTelemetry / tracing docs**
  - Light-weight distributed spans, performance tracing indicators.

### Retrieval and knowledge systems
- [ ] **BM25 / RRF / HNSW / IVFFlat references**
  - Hybrid retrieval ranking formulas, cosine similarities, Reciprocal Rank Fusion algorithms.
- [ ] **Reranking references**
  - Cross-encoders, ONNX pipelines, sub-100ms validation cycles.
- [ ] **Metadata filtering and complexity scoring references**
  - Word length metrics, sentence structures, Flesch-Kincaid implementation formulas.

### Telemetry and human factors
- [ ] **Multimodal sensing / keystroke / voice / fatigue / privacy references**
  - Acoustic feature extraction, keystroke typing rhythms, frame-rate thermal mitigation limits, biometric device encryption hooks.
- [ ] **Mental health escalation and safety references**
  - Crisis mitigation procedures, digital isolation boundary protocols.

### Export and packaging
- [ ] **EPUB / Vite / plugin/schema packaging references**
  - Zip formats, declarative schemas, isolated third-party iframe bounds.

---

## Accepted Sources & Rationale

These canonical vendor documents and standards repositories are designated as authoritative. They serve as the technical references for defining exact implementation schemas, stack dependencies, and thresholds:

### 1. Database & State Storage Engines
* **SQLite Core Documentation (sqlite.org/docs)**
  * *Rationale:* The canonical reference for configuring `PRAGMA` settings (e.g., WAL journal mode, synchronous values, busy timeouts), connection limits, index schemas, and multi-thread flags.
* **SQLCipher Specifications (zetetic.net/sqlcipher/documentation)**
  * *Rationale:* The official reference for page-level database encryption, secure memory clearance, and biometric-tied key derivation functions.
* **pgvector GitHub Reference (github.com/pgvector/pgvector)**
  * *Rationale:* Canonical documentation for configuring HNSW and IVFFlat vector indices, operator mechanics, and memory-to-recall trade-offs.
* **ClickHouse Analytical Engine Manuals (clickhouse.com/docs)**
  * *Rationale:* The definitive manual for high-throughput columnar clustering, vector search scaling, and large-scale analytical query optimization.
* **Neo4j Graph Database Specifications (neo4j.com/docs)**
  * *Rationale:* Official documentation for optimizing Cypher query traversals, executing PageRank and Centrality graph algorithms, and tracking schema properties.

### 2. Sandbox, VM & Execution Runtimes
* **Firecracker MicroVM Specifications (firecracker-microvm.github.io)**
  * *Rationale:* Canonical spec for configuring minimal kernels, cgroups resource isolation, jailer sandboxing, seccomp filters, and microVM snapshotting.
* **WebContainers Technical Docs (webcontainers.io)**
  * *Rationale:* Official documentation for client-side WebAssembly execution, node/npm compilation in browser tabs, and proxying service workers.
* **Pyodide WASM Runtime Manuals (pyodide.org/en/stable)**
  * *Rationale:* Canonical reference for loading and compiling C-Python runtimes in the browser, and setting resource memory ceilings for execution.

### 3. Messaging, Routing & Model Inferencing
* **ONNX Runtime API Docs (onnxruntime.ai/docs)**
  * *Rationale:* Standard specifications for running quantized INT8 transformer cross-encoders, cross-platform compilation, and WebNN execution.
* **Redis Official Documentation (redis.io/docs)**
  * *Rationale:* Definitive resource for polling frequencies, Redis streams configuration, and transactional memory-lock avoidance strategies.
* **NATS Messaging Specifications (docs.nats.io)**
  * *Rationale:* Standard for low-latency pub-sub patterns, JetStream transactional queuing, and cluster state communication.
* **W3C Standards (w3.org)**
  * *Rationale:* Canonical specifications for Service Workers, IndexedDB local client storage, WebSockets, HTML5 postMessage origins, and browser-iframe sandbox attributes.
