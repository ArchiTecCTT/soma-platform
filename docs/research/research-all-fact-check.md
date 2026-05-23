# research-all.md fact-check summary

Status: partial fact-check completed via authoritative web documentation sweep on 2026-05-23.

## Verdict
- Large portions of the report are **architecturally plausible and implementable**.
- Core claims around **SQLite, Yjs, Redis Streams, OpenTelemetry, MDN postMessage/service workers, Firecracker jailer/snapshotting, ONNX Runtime Web, Neo4j GDS, and ClickHouse vector search** are broadly aligned with current public docs.
- The report is **not fully fact-checked line-by-line** yet. Many answers include precise thresholds, latency targets, or scaling cutoffs that are best treated as **design recommendations** unless benchmarked in-project.

## Verified / broadly supported areas
- SQLite defensive mode, prepared statements, WAL, JSON functions
- Redis Streams blocking reads and pipelining
- Yjs document updates, transactions, y-websocket provider behavior
- MDN guidance for iframe sandboxing and window.postMessage
- MDN guidance for Service Worker fetch interception and IndexedDB
- ONNX Runtime Web WebGPU / execution provider guidance
- Firecracker jailer, seccomp, snapshot/restore, namespace-related networking guidance
- Neo4j betweenness centrality and temporal graph modeling direction
- OpenTelemetry JS SDK / browser tracing / OTLP exporter direction
- ClickHouse ANN / HNSW vector search support

## Needs qualification, not hard-fact treatment
These are the main places where the report should be read as architecture guidance, not vendor-guaranteed truth:
- Exact latency guarantees like "<2ms", "<35ms", "<10ms", "sub-100ms"
- Exact scale thresholds like "100,000,000 vectors", "10GB", "5,000 req/sec", "50 writes/sec"
- Exact memory/recall claims for quantization without workload benchmarks
- Claims that a specific reranker/model/runtime combination will always hit a given SLA
- Cross-domain pedagogical heuristics framed as if externally verified rather than designed

## Concrete updates already reflected in the report
- pgvector guidance tightened to current 0.8.x reality rather than older point assumptions
- WebContainers wording tightened around COOP/COEP and SharedArrayBuffer requirements
- ClickHouse vector guidance softened to SLA/workload-driven migration criteria
- ONNX Runtime model/runtime guidance softened to benchmark-driven language

## Known examples of "supported direction, over-specific numbers"
- HNSW + quantization recall percentages
- fixed cutovers from Postgres to ClickHouse
- absolute response-time budgets for rerankers and graph lookups
- fixed storage/router thresholds for local-vs-remote placement

## Recommendation
Use `research-all.md` as a **design-grade architecture document**, not as a standards-grade certification artifact.
If you want a true fact-check, next pass should audit each question and mark one of:
- verified
- partially verified
- recommendation
- source mismatch
- incorrect

## Final assessment
For practical architecture work: **usable**.
For strict factual publication: **needs per-question audit labeling**.
