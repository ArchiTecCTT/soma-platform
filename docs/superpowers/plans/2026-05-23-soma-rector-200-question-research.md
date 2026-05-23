# SOMA + RECTOR 200-Question Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Research and answer all 200 SOMA + RECTOR architecture questions using up-to-date, implementable evidence as of 2026-05-23, produce four batch files and one merged final file.

**Architecture:** Use a one-shot batch pipeline. First normalize the 200 questions from `research-context.txt` into a machine-readable manifest, then gather evidence by topic using authoritative web sources and docs, then write four batch markdown artifacts, run a consistency/coverage pass, and merge into a final report. Keep context small by using indexed/fetched sources and sandboxed processing instead of raw output.

**Tech Stack:** Pi tools (`read`, `write`, `edit`), context-mode (`ctx_execute`, `ctx_execute_file`, `ctx_fetch_and_index`, `ctx_search`, `ctx_batch_execute`), optional `web_search`, Markdown artifacts.

---

## File Structure

**Files:**
- Read: `research-context.txt`
- Create: `docs/research/2026-05-23-soma-rector-question-manifest.json`
- Create: `docs/research/2026-05-23-source-register.md`
- Create: `docs/research/batch-1.md`
- Create: `docs/research/batch-2.md`
- Create: `docs/research/batch-3.md`
- Create: `docs/research/batch-4.md`
- Create: `docs/research/research-all.md`
- Create: `docs/research/2026-05-23-research-notes.md`

**Responsibilities:**
- `research-context.txt`: source of truth for all 200 questions.
- `question-manifest.json`: normalized machine-readable question inventory with ids, product, section, batch.
- `source-register.md`: curated source list grouped by topic with why each source is trusted.
- `batch-1.md`..`batch-4.md`: answer artifacts for 50 questions each.
- `research-all.md`: concatenated final deliverable.
- `research-notes.md`: execution notes, source gaps, decisions, unresolved caveats.

---

### Task 1: Normalize the 200-question manifest

**Files:**
- Read: `research-context.txt`
- Create: `docs/research/2026-05-23-soma-rector-question-manifest.json`
- Create: `docs/research/2026-05-23-research-notes.md`

- [ ] **Step 1: Create the manifest extraction script in sandbox output**

```javascript
try {
  const fs = require('fs');
  const path = require('path');
  const text = fs.readFileSync('research-context.txt', 'utf8');
  const lines = text.split(/\r?\n/);
  const result = [];
  let currentProduct = null;
  let currentSection = null;
  let batch = 1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^Here are the questions for the SOMA platform:/i.test(line)) {
      currentProduct = 'SOMA';
      continue;
    }
    if (/^Here are the questions for the RECTOR AI:/i.test(line)) {
      currentProduct = 'RECTOR';
      continue;
    }
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }
    const qMatch = line.match(/^\*\s*(\d+)\.\s+(.+)$/);
    if (qMatch && currentProduct && currentSection) {
      const questionNumber = Number(qMatch[1]);
      const globalIndex = result.length + 1;
      batch = Math.ceil(globalIndex / 50);
      result.push({
        globalIndex,
        batch,
        product: currentProduct,
        localQuestionNumber: questionNumber,
        section: currentSection,
        question: qMatch[2].trim()
      });
    }
  }
  console.log(JSON.stringify({ count: result.length, first: result[0], last: result[result.length - 1] }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: String(error && error.message || error) }, null, 2));
}
```

- [ ] **Step 2: Run the extraction summary to verify count is 200**

Run: use `context_mode_ctx_execute` with the script above.
Expected: JSON summary with `count: 200`, first question from SOMA, last question from RECTOR.

- [ ] **Step 3: Write the normalized manifest file**

```json
[
  {
    "globalIndex": 1,
    "batch": 1,
    "product": "SOMA",
    "localQuestionNumber": 1,
    "section": "1. Unified SQL Gate & Core Data Architecture",
    "question": "How will the Unified SQL Gate parse loose, non-relational intent from the LLM into safe, structured relational database transactions without creating a performance bottleneck?"
  }
]
```

Write full extracted array to: `docs/research/2026-05-23-soma-rector-question-manifest.json`

- [ ] **Step 4: Write research notes bootstrap**

```markdown
# 2026-05-23 Research Notes

- Scope: 200 questions from `research-context.txt`
- Execution mode: one-shot, 4 batches of 50, then merge
- Freshness target: facts current to 2026-05-23
- Quality bar: implementable now, concrete stacks, thresholds, tradeoffs
- Output style: direct answer, implementation path, recommended default, caveats
```

- [ ] **Step 5: Commit**

```bash
git add docs/research/2026-05-23-soma-rector-question-manifest.json docs/research/2026-05-23-research-notes.md
git commit -m "docs: scaffold research manifest and notes"
```

### Task 2: Define answer schema and source standards

**Files:**
- Modify: `docs/research/2026-05-23-research-notes.md`
- Create: `docs/research/2026-05-23-source-register.md`

- [ ] **Step 1: Append answer template to research notes**

```markdown
## Answer Template

For each question, use:
1. **Answer** — short direct recommendation.
2. **Implement now** — concrete architecture/pattern.
3. **Recommended stack** — exact technologies or protocols.
4. **Why this over alternatives** — practical tradeoff.
5. **Caveats / scale trigger** — when to switch approaches.
6. **Sources** — authoritative links or documents used.
```

- [ ] **Step 2: Append source acceptance criteria to research notes**

```markdown
## Source Acceptance Criteria

Prefer, in order:
1. Official docs / vendor docs / standards
2. Maintainer engineering blogs and release notes
3. Source repos / issue discussions with implementation detail
4. High-quality benchmark writeups with reproducible methods

Avoid:
- SEO fluff
- generic AI-generated summaries
- opinion-only articles without implementation detail
- stale pre-2025 sources unless still canonical
```

- [ ] **Step 3: Create source register scaffold**

```markdown
# 2026-05-23 Source Register

## Core platform architecture
- [ ] SQLite / SQLCipher / LiteFS / CRDT docs
- [ ] Postgres / pgvector / ClickHouse docs
- [ ] Neo4j / graph modeling / graph algorithms docs
- [ ] WebContainers / Pyodide / sandbox docs
- [ ] Firecracker / E2B / isolation docs
- [ ] ONNX Runtime / rerankers / quantization docs
- [ ] Redis / NATS / queueing docs
- [ ] OpenTelemetry / tracing docs

## Retrieval and knowledge systems
- [ ] BM25 / RRF / HNSW / IVFFlat references
- [ ] reranking references
- [ ] metadata filtering and complexity scoring references

## Telemetry and human factors
- [ ] multimodal sensing / keystroke / voice / fatigue / privacy references
- [ ] mental health escalation and safety references

## Export and packaging
- [ ] EPUB / Vite / plugin/schema packaging references
```

- [ ] **Step 4: Commit**

```bash
git add docs/research/2026-05-23-research-notes.md docs/research/2026-05-23-source-register.md
git commit -m "docs: define research answer schema and source standards"
```

### Task 3: Gather authoritative sources by topic

**Files:**
- Modify: `docs/research/2026-05-23-source-register.md`
- Modify: `docs/research/2026-05-23-research-notes.md`

- [ ] **Step 1: Fetch and index primary web sources in batches**

Use `context_mode_ctx_fetch_and_index` with grouped requests such as:

```json
{
  "requests": [
    { "url": "https://www.sqlite.org/", "source": "sqlite" },
    { "url": "https://www.sqlite.org/pragma.html", "source": "sqlite pragmas" },
    { "url": "https://www.zetetic.net/sqlcipher/", "source": "sqlcipher" },
    { "url": "https://github.com/pgvector/pgvector", "source": "pgvector" },
    { "url": "https://clickhouse.com/docs", "source": "clickhouse docs" },
    { "url": "https://neo4j.com/docs/", "source": "neo4j docs" },
    { "url": "https://firecracker-microvm.github.io/", "source": "firecracker docs" },
    { "url": "https://webcontainers.io/", "source": "webcontainers docs" }
  ],
  "concurrency": 6,
  "force": false
}
```

- [ ] **Step 2: Fetch and index secondary topic sources**

Use additional grouped fetches for:
- ONNX Runtime
- sentence-transformers / rerankers
- OpenTelemetry
- Redis docs
- CRDT/Yjs/Automerge docs
- LiteFS / Turso / rqlite style local-first references
- Pyodide docs
- E2B docs
- LiveKit docs if RTC/sensory transport matters
- W3C / MDN docs for `postMessage`, Service Worker, IndexedDB

Expected: indexed sources with searchable labels, no raw HTML in context.

- [ ] **Step 3: Search indexed docs for exact implementation facts**

Use `context_mode_ctx_search` with batched queries like:

```json
{
  "queries": [
    "sqlite WAL busy_timeout prepared statements transactions best practices",
    "pgvector hnsw ivfflat memory recall tradeoff docs",
    "clickhouse vector search support scaling analytical workload docs",
    "neo4j graph modeling prerequisites centrality pagerank docs",
    "firecracker snapshot cold start cgroups jailer docs",
    "webcontainers persistence IndexedDB docs",
    "onnx runtime cross encoder reranker int8 latency docs",
    "Yjs Automerge CRDT offline sync docs"
  ],
  "limit": 5
}
```

- [ ] **Step 4: Update source register with accepted sources and one-line rationale**

```markdown
## Accepted Sources
- SQLite docs — canonical for WAL, transactions, limits, indexing.
- pgvector GitHub/docs — canonical for HNSW/IVFFlat features and operator behavior.
- ClickHouse docs — canonical for scale and analytical engine guidance.
- Neo4j docs — canonical for graph traversal and algorithms.
- Firecracker docs — canonical for snapshots, jailer, rate limiting, seccomp.
- WebContainers docs — canonical for browser sandbox behavior and persistence.
```

- [ ] **Step 5: Append topic buckets to research notes**

```markdown
## Topic Buckets
- Batch 1: SOMA Q1-50 — SQL, RAG, graph, sandbox, server sandboxing
- Batch 2: SOMA Q51-100 — tools, creativity, sync, caching, complexity, extensibility
- Batch 3: RECTOR Q1-50 — telemetry, daemon, dILP, routing, local brain
- Batch 4: RECTOR Q51-100 — retention, profiling, deterministic router, veto layer, alignment
```

- [ ] **Step 6: Commit**

```bash
git add docs/research/2026-05-23-source-register.md docs/research/2026-05-23-research-notes.md
git commit -m "docs: register authoritative research sources"
```

### Task 4: Draft Batch 1 answers (Q1-50)

**Files:**
- Read: `docs/research/2026-05-23-soma-rector-question-manifest.json`
- Create: `docs/research/batch-1.md`

- [ ] **Step 1: Extract batch 1 questions in sandbox**

```javascript
try {
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('docs/research/2026-05-23-soma-rector-question-manifest.json', 'utf8'));
  const batch = data.filter(item => item.batch === 1);
  console.log(JSON.stringify({ count: batch.length, first: batch[0], last: batch[batch.length - 1] }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: String(error && error.message || error) }, null, 2));
}
```

- [ ] **Step 2: Search indexed sources for batch 1 topics**

Use `context_mode_ctx_search` with queries covering:
- SQLite schema, WAL, transactions, pooling
- RAG chunking, BM25 + vector fusion, rerankers, metadata filters
- Neo4j graph depth, centrality, modeling contradictions
- WebContainers, hot reload, service workers, worker isolation
- Firecracker cold starts, cgroups, network controls, snapshots, secrets handling

- [ ] **Step 3: Write batch 1 file using full answer structure**

```markdown
# Batch 1 — Questions 1-50

## Q1. [exact question]
**Answer:** ...
**Implement now:** ...
**Recommended stack:** ...
**Why this over alternatives:** ...
**Caveats / scale trigger:** ...
**Sources:** ...
```

Include all 50 questions, in order, with concrete recommendations.

- [ ] **Step 4: Run batch 1 coverage check in sandbox**

```javascript
try {
  const fs = require('fs');
  const text = fs.readFileSync('docs/research/batch-1.md', 'utf8');
  const matches = [...text.matchAll(/^##\s+Q(\d+)\./gm)].map(m => Number(m[1]));
  console.log(JSON.stringify({ count: matches.length, first: matches[0], last: matches[matches.length - 1], unique: new Set(matches).size }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: String(error && error.message || error) }, null, 2));
}
```

Expected: 50 entries, first 1, last 50, unique 50.

- [ ] **Step 5: Commit**

```bash
git add docs/research/batch-1.md
git commit -m "docs: add research batch 1 answers"
```

### Task 5: Draft Batch 2 answers (Q51-100)

**Files:**
- Read: `docs/research/2026-05-23-soma-rector-question-manifest.json`
- Create: `docs/research/batch-2.md`

- [ ] **Step 1: Extract batch 2 questions in sandbox**

```javascript
try {
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('docs/research/2026-05-23-soma-rector-question-manifest.json', 'utf8'));
  const batch = data.filter(item => item.batch === 2);
  console.log(JSON.stringify({ count: batch.length, first: batch[0], last: batch[batch.length - 1] }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: String(error && error.message || error) }, null, 2));
}
```

- [ ] **Step 2: Search indexed sources for batch 2 topics**

Use `context_mode_ctx_search` with queries covering:
- markdown/wiki links, note parsing, block-based editors
- Yjs/CRDT sync, caching, vector locality, deterministic cache keys
- complexity scoring, readability, metadata filtering, query fallback
- plugin sandboxing, schema versioning, OpenTelemetry, sharding, storage tiers, pack formats

- [ ] **Step 3: Write batch 2 file using full answer structure**

```markdown
# Batch 2 — Questions 51-100

## Q51. [exact question]
**Answer:** ...
**Implement now:** ...
**Recommended stack:** ...
**Why this over alternatives:** ...
**Caveats / scale trigger:** ...
**Sources:** ...
```

- [ ] **Step 4: Run batch 2 coverage check in sandbox**

```javascript
try {
  const fs = require('fs');
  const text = fs.readFileSync('docs/research/batch-2.md', 'utf8');
  const matches = [...text.matchAll(/^##\s+Q(\d+)\./gm)].map(m => Number(m[1]));
  console.log(JSON.stringify({ count: matches.length, first: matches[0], last: matches[matches.length - 1], unique: new Set(matches).size }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: String(error && error.message || error) }, null, 2));
}
```

Expected: 50 entries, first 51, last 100, unique 50.

- [ ] **Step 5: Commit**

```bash
git add docs/research/batch-2.md
git commit -m "docs: add research batch 2 answers"
```

### Task 6: Draft Batch 3 answers (Q101-150)

**Files:**
- Read: `docs/research/2026-05-23-soma-rector-question-manifest.json`
- Create: `docs/research/batch-3.md`

- [ ] **Step 1: Extract batch 3 questions in sandbox**

```javascript
try {
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('docs/research/2026-05-23-soma-rector-question-manifest.json', 'utf8'));
  const batch = data.filter(item => item.batch === 3);
  console.log(JSON.stringify({ count: batch.length, first: batch[0], last: batch[batch.length - 1] }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: String(error && error.message || error) }, null, 2));
}
```

- [ ] **Step 2: Search indexed sources for batch 3 topics**

Use `context_mode_ctx_search` with queries covering:
- audio/video edge telemetry, keystroke dynamics, IPC, buffer passing
- Redis polling / pubsub / streams / local mirroring
- differentiable ILP / symbolic rule storage / auditability
- dependency maps, cross-domain routing, local SQLite epistemic indexing, SQLCipher

- [ ] **Step 3: Write batch 3 file using full answer structure**

```markdown
# Batch 3 — Questions 101-150

## Q101. [exact question]
**Answer:** ...
**Implement now:** ...
**Recommended stack:** ...
**Why this over alternatives:** ...
**Caveats / scale trigger:** ...
**Sources:** ...
```

- [ ] **Step 4: Run batch 3 coverage check in sandbox**

```javascript
try {
  const fs = require('fs');
  const text = fs.readFileSync('docs/research/batch-3.md', 'utf8');
  const matches = [...text.matchAll(/^##\s+Q(\d+)\./gm)].map(m => Number(m[1]));
  console.log(JSON.stringify({ count: matches.length, first: matches[0], last: matches[matches.length - 1], unique: new Set(matches).size }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: String(error && error.message || error) }, null, 2));
}
```

Expected: 50 entries, first 101, last 150, unique 50.

- [ ] **Step 5: Commit**

```bash
git add docs/research/batch-3.md
git commit -m "docs: add research batch 3 answers"
```

### Task 7: Draft Batch 4 answers (Q151-200)

**Files:**
- Read: `docs/research/2026-05-23-soma-rector-question-manifest.json`
- Create: `docs/research/batch-4.md`

- [ ] **Step 1: Extract batch 4 questions in sandbox**

```javascript
try {
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('docs/research/2026-05-23-soma-rector-question-manifest.json', 'utf8'));
  const batch = data.filter(item => item.batch === 4);
  console.log(JSON.stringify({ count: batch.length, first: batch[0], last: batch[batch.length - 1] }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: String(error && error.message || error) }, null, 2));
}
```

- [ ] **Step 2: Search indexed sources for batch 4 topics**

Use `context_mode_ctx_search` with queries covering:
- spaced repetition for concepts, retrieval practice, transfer tests, mastery thresholds
- onboarding diagnostics, profiling without surveys, baseline calibration
- Go/Rust router patterns, timeout fallback, plugin middleware, ONNX deployment
- graph veto, contested facts, safety, crisis boundaries, context summarization, extensibility

- [ ] **Step 3: Write batch 4 file using full answer structure**

```markdown
# Batch 4 — Questions 151-200

## Q151. [exact question]
**Answer:** ...
**Implement now:** ...
**Recommended stack:** ...
**Why this over alternatives:** ...
**Caveats / scale trigger:** ...
**Sources:** ...
```

- [ ] **Step 4: Run batch 4 coverage check in sandbox**

```javascript
try {
  const fs = require('fs');
  const text = fs.readFileSync('docs/research/batch-4.md', 'utf8');
  const matches = [...text.matchAll(/^##\s+Q(\d+)\./gm)].map(m => Number(m[1]));
  console.log(JSON.stringify({ count: matches.length, first: matches[0], last: matches[matches.length - 1], unique: new Set(matches).size }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: String(error && error.message || error) }, null, 2));
}
```

Expected: 50 entries, first 151, last 200, unique 50.

- [ ] **Step 5: Commit**

```bash
git add docs/research/batch-4.md
git commit -m "docs: add research batch 4 answers"
```

### Task 8: Merge, self-review, and validate consistency

**Files:**
- Read: `docs/research/batch-1.md`
- Read: `docs/research/batch-2.md`
- Read: `docs/research/batch-3.md`
- Read: `docs/research/batch-4.md`
- Create: `docs/research/research-all.md`
- Modify: `docs/research/2026-05-23-research-notes.md`

- [ ] **Step 1: Merge the four batch files into final report**

```markdown
# SOMA + RECTOR 200-Question Research Report

- Generated: 2026-05-23
- Freshness target: factual and implementable as of 2026-05-23
- Structure: merged from four 50-question batch files

---

[contents of batch-1.md]

---

[contents of batch-2.md]

---

[contents of batch-3.md]

---

[contents of batch-4.md]
```

- [ ] **Step 2: Run global coverage check in sandbox**

```javascript
try {
  const fs = require('fs');
  const text = fs.readFileSync('docs/research/research-all.md', 'utf8');
  const matches = [...text.matchAll(/^##\s+Q(\d+)\./gm)].map(m => Number(m[1]));
  const missing = [];
  for (let i = 1; i <= 200; i++) if (!matches.includes(i)) missing.push(i);
  console.log(JSON.stringify({ count: matches.length, unique: new Set(matches).size, first: matches[0], last: matches[matches.length - 1], missing }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: String(error && error.message || error) }, null, 2));
}
```

Expected: `count: 200`, `unique: 200`, `first: 1`, `last: 200`, `missing: []`.

- [ ] **Step 3: Run quality scan for weak placeholders**

```javascript
try {
  const fs = require('fs');
  const text = fs.readFileSync('docs/research/research-all.md', 'utf8');
  const bad = ['TBD', 'TODO', 'maybe', 'probably', 'it depends'];
  const found = bad.filter(term => text.includes(term));
  console.log(JSON.stringify({ found }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: String(error && error.message || error) }, null, 2));
}
```

Expected: empty or intentionally minimal results.

- [ ] **Step 4: Append completion notes**

```markdown
## Completion Notes
- Four batches written and merged.
- Coverage validated for Q1-Q200.
- Final pass checked for numbering and weak-placeholder language.
- Remaining work, if any: user refinement based on preferred product direction.
```

- [ ] **Step 5: Commit**

```bash
git add docs/research/research-all.md docs/research/2026-05-23-research-notes.md
git commit -m "docs: merge full soma rector research report"
```

## Self-Review

- Spec coverage: covers extraction, source gathering, batch drafting, validation, merge, and final note pass for all 200 questions.
- Placeholder scan: no TBD/TODO placeholders in execution steps; commands, file paths, and validation steps are explicit.
- Type consistency: file names, batch ranges, and manifest schema are consistent across tasks.

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-23-soma-rector-200-question-research.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
