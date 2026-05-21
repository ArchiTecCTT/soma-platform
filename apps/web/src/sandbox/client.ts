import { WebContainer } from '@webcontainer/api';
import { SandboxState, SandboxFile, SandboxStateSchema, ReadSandboxStateRequest } from '@soma/shared';

let globalBootPromise: Promise<WebContainer> | null = null;
let globalWebContainer: WebContainer | null = null;

export class SandboxClient {
  private files: Map<string, string> = new Map();
  private stdoutTail = '';
  private stderrTail = '';
  private activeFilePath = '/src/index.js';
  private lastCommand = '';
  private exitCode: number | null = null;
  private status: 'idle' | 'running' | 'completed' | 'failed' = 'idle';

  constructor() {
    // default file /src/index.js with add function
    this.files.set('/src/index.js', `export function add(a, b) {\n  return a + b;\n}\nconsole.log(add(2, 3));\n`);
  }

  get webcontainer(): WebContainer | null {
    return globalWebContainer;
  }

  async init(): Promise<WebContainer> {
    if (globalBootPromise) {
      return globalBootPromise;
    }

    globalBootPromise = (async () => {
      const instance = await WebContainer.boot();
      globalWebContainer = instance;

      // Ensure directory /src recursive
      await instance.fs.mkdir('/src', { recursive: true });

      // Sync existing memory files to the webcontainer
      for (const [path, content] of this.files.entries()) {
        await instance.fs.writeFile(path, content);
      }

      return instance;
    })();

    return globalBootPromise;
  }

  async syncFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
    if (this.webcontainer) {
      // Ensure folder of the file path is created
      const dir = path.substring(0, path.lastIndexOf('/'));
      if (dir && dir !== '/') {
        await this.webcontainer.fs.mkdir(dir, { recursive: true });
      }
      await this.webcontainer.fs.writeFile(path, content);
    }
  }

  async runEntry(entryPath: string): Promise<number> {
    this.activeFilePath = entryPath;
    this.status = 'running';
    this.lastCommand = `node ${entryPath}`;
    this.stdoutTail = '';
    this.stderrTail = '';
    this.exitCode = null;

    try {
      const container = await this.init();

      // Spawn node — first verify file exists, then require it
      const process = await container.spawn('node', ['-e', `
        const fs = require('fs');
        const fp = '${entryPath}';
        if (!fs.existsSync(fp)) throw new Error('ENOENT: ' + fp);
        require(fp);
      `]);

      // Pipe stdout
      const writableStdout = new WritableStream({
        write: (chunk) => {
          this.stdoutTail += chunk;
        },
      });
      process.output.pipeTo(writableStdout).catch(() => {});

      const code = await process.exit;
      this.exitCode = code;
      this.status = code === 0 ? 'completed' : 'failed';
      return code;
    } catch (err) {
      this.status = 'failed';
      this.stderrTail += err instanceof Error ? err.message : String(err);
      this.exitCode = 1;
      return 1;
    }
  }

  snapshot(request: ReadSandboxStateRequest): SandboxState {
    const maxChars = Math.min(request.maxChars, 4000);
    
    // Select up to 5 files, truncate their contents if needed, and map to SandboxFile format
    const fileEntries = Array.from(this.files.entries()).slice(0, 5);
    const files: SandboxFile[] = fileEntries.map(([path, content]) => {
      const truncatedContent = content.length > maxChars ? content.slice(0, maxChars) : content;
      return { path, content: truncatedContent };
    });

    const truncatedStdout = this.stdoutTail.length > maxChars ? this.stdoutTail.slice(-maxChars) : this.stdoutTail;
    const truncatedStderr = this.stderrTail.length > maxChars ? this.stderrTail.slice(-maxChars) : this.stderrTail;

    const rawState = {
      sessionId: request.sessionId,
      turnId: request.turnId,
      activeFilePath: this.activeFilePath,
      files,
      stdoutTail: truncatedStdout,
      stderrTail: truncatedStderr,
      lastCommand: this.lastCommand || undefined,
      exitCode: this.exitCode,
      status: this.status,
      capturedAt: new Date().toISOString(),
    };

    return SandboxStateSchema.parse(rawState);
  }
}
