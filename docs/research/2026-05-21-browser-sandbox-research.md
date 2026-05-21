# Research: Browser-Side Execution and Collaboration Sandbox (2026)

## Summary
To build an interactive, voice-augmented coding and execution playground with a low-friction multiplayer experience, we evaluate browser-side runtimes, sandboxing/isolation protocols, and collaboration engines. For the execution sandbox, **WebContainer API** is the superior in-browser choice for Node.js workflows, while **Pyodide** excels at Python data science, and **E2B/server-side microVMs** remain necessary for full OS/database capabilities. For collaboration, **Yjs** backed by **Liveblocks** provides an ideal MVP setup that eliminates server hosting burdens while delivering Figma-grade collaborative cursor presence and rich text synchronization out of the box.

---

## Findings

### 1. Browser-Side Execution: WebContainer vs. Pyodide vs. Defer-to-Server
* **WebContainer**: Runs a WebAssembly-compiled version of Node.js, package managers (`npm`, `pnpm`, `yarn`), and a virtual filesystem entirely within the browser sandbox. 
  * *Pros*: Zero server compute costs; sub-second cold starts once cached; full Node.js file system capabilities and virtual TCP port-to-browser server redirection [TechPlained](https://www.techplained.com/webcontainers-stackblitz).
  * *Cons*: Requires strict Cross-Origin Isolation headers [WebContainers Docs](https://webcontainers.io/guides/browser-support); cannot execute compiled C/C++ native addons (`node-gyp`) unless pre-compiled to WebAssembly; no raw TCP/UDP networking (traffic is intercepted and shimmed via WebSockets/HTTP proxies) [TechPlained](https://www.techplained.com/webcontainers-stackblitz).
* **Pyodide**: CPython compiled to WebAssembly via Emscripten.
  * *Pros*: Zero server costs; standard library is fully functional; supports loading pure-Python wheels dynamically via `micropip` and pre-compiled data science binaries (NumPy, Pandas, SciPy, Matplotlib) [Pyodide Docs](https://pyodide.org/en/latest/usage/wasm-constraints.html).
  * *Cons*: Large download footprint (~6.4MB base engine) resulting in slow first cold-starts (4-5s); restricted to WebAssembly-compatible libraries; no true multi-threaded `pthreads` or raw socket networking out-of-the-box [Pyodide Docs](https://pyodide.org/en/latest/usage/wasm-constraints.html).
* **Defer-to-Server (E2B, Daytona, Firecracker)**: Offloads execution to secure, ephemeral Linux microVMs hosted in the cloud.
  * *Pros*: Complete operating system access, full network capabilities (raw TCP, outgoing internet), support for any runtime/database (e.g., PostgreSQL, Redis), and zero browser-isolation headaches [E2B Docs](https://e2b.dev/docs/sdk-reference/js-sdk/v2.6.4/sandbox).
  * *Cons*: Scales linearly with server infrastructure costs; introduces internet round-trip latency; network/VM orchestration required [PkgPulse Sandbox Guide](https://www.pkgpulse.com/guides/e2b-vs-daytona-vs-webcontainers-ai-agent-sandboxes-2026).

### 2. Sandbox Security & Worker Isolation
* **Cross-Origin Isolation**: Both WebContainers and multi-threaded Pyodide require `SharedArrayBuffer` (SAB) to share memory across workers. Activating SAB requires serving two headers:
  ```http
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```
  While secure, this can block or break third-party embeds (Stripe, YouTube, Auth0) within the same page [uper.pl Isolation Guide](https://uper.pl/en/blog/coop-coep-corp-cross-origin-isolation/).
* **Document Isolation Policy**: In Chromium 137+, the newly introduced **Document Isolation Policy** offers a cleaner path. It applies isolation boundaries *per frame* instead of the entire browsing context group, unlocking SAB capabilities for individual sandbox frames without imposing COEP restrictions on parent/sibling frames [Chrome Developers Blog](https://developer.chrome.com/blog/document-isolation-policy).
* **Worker vs. Service Worker Isolation**: 
  * WebContainers run Node.js in dedicated Web Workers and utilize a Service Worker to intercept network requests, allowing local preview servers to run dynamically inside a virtual domain inside the user's tab.
  * Code executed inside the container is sandboxed by standard browser security boundaries (origin-based separation), ensuring users or AI scripts cannot compromise the host computer.

### 3. RPC Patterns (Voice Agent to Sandbox Communication)
* **Comlink (postMessage abstraction)**: For thread separation, [Comlink](https://github.com/GoogleChrome/comlink) uses ES6 Proxies to map remote asynchronously executed code in an iframe or Web Worker to local JavaScript methods. It provides a clean, type-safe, and low-overhead boundary for passing code edits, commands, and terminal outputs between the UI and the execution worker.
* **Server-Assisted WebRTC/WebSocket Sync**: If the voice agent runs on a server (e.g., LiveKit integration executing text-to-speech and intent processing) [Vercel Sandbox Guide](https://github.com/vercel/examples/tree/main/guides/sandbox-voice-agent), file operations are synchronized from the voice server to the frontend via WebSockets, which then writes those edits directly to the WebContainer filesystem using the WebContainer API's virtual directory handlers (`webcontainerInstance.fs.writeFile`).

### 4. Collaborative Editors & Social-Drop-In MVP Features
* **Yjs (CRDT Incumbent)**: Mathematical Conflict-free Replicated Data Type engine. Highly optimized for text editing; has mature, battle-tested bindings for popular web editors including Monaco (VS Code core), Quill, Tiptap, ProseMirror, and Lexical [PkgPulse CRDT Guide](https://www.pkgpulse.com/blog/yjs-vs-automerge-vs-loro-crdt-libraries-2026).
* **Automerge / Loro**: Excellent alternative CRDT implementations, with Loro introducing Rust-powered performance. However, they lack the sheer breadth of ready-to-use editor bindings available for Yjs.
* **Liveblocks**: A specialized real-time SaaS platform that integrates directly with Yjs (`@liveblocks/yjs`) [Liveblocks Yjs Docs](https://liveblocks.io/docs/platform/sync-datastore/liveblocks-yjs).
  * *Pros for MVP*: Completely eliminates the need to host and maintain socket servers (like Hocuspocus or `y-websocket`); provides drop-in React components/hooks for collaborative cursor presence, typing indicators, avatar bars, and persistent page comments [Liveblocks Multiplayer](https://liveblocks.io/sync-datastore/yjs).
  * *Cons*: Free tier is generous, but scales to paid tiers once active monthly users grow [StarterPick Collaboration Guide](https://starterpick.com/blog/best-boilerplates-realtime-collaboration-2026).

---

## Recommended MVP Scope

To minimize infrastructure complexity, operational costs, and latency, the following architecture is recommended for the initial release:

1. **Collaboration Backend**: Use **Liveblocks with `@liveblocks/yjs`**. It provides robust hosting for Yjs documents, instant real-time sync, and pre-built React components for collaborative cursors, typing indicators, and user avatars without requiring server setup.
2. **Editor**: **Tiptap (ProseMirror-based)** or **Lexical** for documentation/rich text, and **Monaco Editor** for code. Both bind natively to Yjs.
3. **Execution Sandbox**: Use browser-side **WebContainers** for JavaScript/TypeScript environments, and **Pyodide** for Python data science snippets. 
   * *Fallback*: If the user attempts to run a database, complex Python package (e.g., PyTorch, deep learning dependencies), or a language like Go/Rust, degrade gracefully to a hosted **E2B sandbox** instance.
4. **RPC Architecture**: Use **Comlink** to decouple editor instances and the UI from the WebContainer and Web Worker threads. Synchronize files directly from the Yjs document state into the WebContainer virtual filesystem on-the-fly.

---

## Phased Rollout Advice

### Phase 1: Local In-Tab Execution (Weeks 1–3)
* Set up a Monaco editor in a React frontend.
* Integrate the **WebContainer API** with **Document Isolation Policy** headers enabled to ensure SAB isolation works smoothly without disrupting external scripts.
* Use **Comlink** to link the virtual terminal input/output between the UI thread and the sandbox.

### Phase 2: Multiplayer & Collaboration (Weeks 4–6)
* Add **Liveblocks** to sync the Monaco editor instances across clients using the `@liveblocks/yjs` provider.
* Implement real-time cursor presence and typing indicators using Liveblocks pre-built components.
* Map incoming collaborative changes from the Yjs document immediately to the WebContainer's virtual file system so all connected peers' sandboxes run the identical updated codebase.

### Phase 3: Server-Side Fallback & Multi-Language (Weeks 7–9)
* Integrate **Pyodide** for standard Python execution in-browser.
* Implement an automated environment-detection layer: if a script requires un-supported packages or full OS resources (e.g., PostgreSQL or multi-core processing), spin up an ephemeral cloud-hosted **E2B container** and stream standard output/standard error to the shared browser terminal.

---

## Sources
* **Kept**: [WebContainers Browser Support](https://webcontainers.io/guides/browser-support) — Authoritative requirements for running WebContainers in modern browsers (COOP/COEP / SharedArrayBuffers).
* **Kept**: [Chrome Developers Blog - Document Isolation Policy](https://developer.chrome.com/blog/document-isolation-policy) — Introduces Chromium 137's cleaner alternative to the complex COEP/COOP setup.
* **Kept**: [Liveblocks Yjs Integration](https://liveblocks.io/docs/platform/sync-datastore/liveblocks-yjs) — Official API guidelines for utilizing managed Yjs hosting instead of building a self-hosted `y-websocket` server.
* **Kept**: [Pyodide WASM Constraints](https://pyodide.org/en/latest/usage/wasm-constraints.html) — Outlines performance bottlenecks, memory overheads, and packaging limits of WebAssembly-based CPython.
* **Kept**: [GoogleChromeLabs/comlink GitHub](https://github.com/GoogleChrome/comlink) — Explains proxying and postMessage serialization mechanisms for background workers.
* **Dropped**: *Generic System Design Blogs* — Excluded due to heavy focus on old centralized Operational Transformation (OT) methodologies rather than modern 2026 CRDT and SaaS implementations.

---

## Gaps
* **Mobile Browser Performance**: Running a WebContainer node process on mobile browsers (Safari/Chrome on iOS) remains highly constrained by device memory limits and aggressive background process termination. Detailed benchmarking for battery consumption and thermal throttling on mobile devices in 2026 is limited and requires manual profiling.
* **Network Interception Limits**: In WebContainers, local loopback sockets are shimmed using service workers. Real-world performance under heavy websocket throughput (such as high-frequency real-time audio streams from voice agents directly to an in-browser dev server) is untested and might require fallback to a dedicated cloud VM (E2B).
