import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { app } from "electron";

type EventHandler = (data: unknown) => void;

class NativeBridge {
  private process: ChildProcess | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private isRunning = false;
  private buffer = "";

  on(channel: string, handler: EventHandler): () => void {
    if (!this.handlers.has(channel)) this.handlers.set(channel, new Set());
    this.handlers.get(channel)!.add(handler);
    return () => this.handlers.get(channel)?.delete(handler);
  }

  off(channel: string, handler: EventHandler): void {
    this.handlers.get(channel)?.delete(handler);
  }

  send(command: string, data?: Record<string, unknown>): void {
    if (!this.process || !this.isRunning) return;
    const msg = JSON.stringify({ command, data }) + "\n";
    this.process.stdin?.write(msg);
  }

  start(): void {
    if (this.isRunning) return;

    const rel = path.join("bridge", "bridge.ps1");
    let primary: string;
    if (app.isPackaged) {
      // In a packaged build the .ps1 is extracted next to app.asar; the
      // packed (inside-asar) copy is NOT readable by PowerShell, so we must
      // use the unpacked location.
      primary = path.join(process.resourcesPath || "", "app.asar.unpacked", rel);
    } else {
      primary = path.join(__dirname, "..", "..", rel);
    }
    const fallbacks = [
      path.join(process.cwd(), rel),
      path.join(app.getAppPath(), rel),
      path.join(process.resourcesPath || "", rel),
    ];

    const scriptPath = (function resolve(): string {
      if (fs.existsSync(primary)) return primary;
      for (const c of fallbacks) {
        if (c && fs.existsSync(c)) return c;
      }
      return primary;
    })();
    if (!fs.existsSync(scriptPath)) {
      console.error(
        "[NativeBridge] bridge.ps1 not found at",
        scriptPath,
        "fallbacks:",
        fallbacks,
      );
      // Bridge may not be unpacked yet; retry so the build still comes up.
      setTimeout(() => this.start(), 2000);
      return;
    }

    this.process = spawn(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
      {
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      },
    );

    this.isRunning = true;

    this.process.stdout?.on("data", (chunk: Buffer) => {
      this.buffer += chunk.toString();
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          if (msg.type === "ready") {
            console.log("[NativeBridge] Bridge ready");
          } else if (msg.type === "event" && msg.channel && msg.data) {
            const handlers = this.handlers.get(msg.channel);
            if (handlers) handlers.forEach((h) => h(msg.data));
          } else if (msg.type === "error") {
            console.error("[NativeBridge] Bridge error:", msg.message);
          }
        } catch {
          // partial JSON
        }
      }
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      console.error("[NativeBridge] stderr:", data.toString());
    });

    this.process.on("exit", (code) => {
      console.log(`[NativeBridge] Exited with code ${code}`);
      this.isRunning = false;
      this.process = null;
      setTimeout(() => this.start(), 5000);
    });

    this.process.on("error", (err) => {
      console.error("[NativeBridge] Error:", err.message);
      this.isRunning = false;
      this.process = null;
    });
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.isRunning = false;
  }
}

export const nativeBridge = new NativeBridge();
