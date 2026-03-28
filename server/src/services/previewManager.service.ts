import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import getPort from 'get-port';
import path from 'path';

interface PreviewServer {
  port: number;
  process: ChildProcess;
  framework: string;
  ready: boolean;
}

class PreviewManager {
  private servers = new Map<string, PreviewServer>();

  async startPreview(projectId: string, framework: string, projectPath: string): Promise<{ port: number; status: string }> {
    const existing = this.servers.get(projectId);
    if (existing) {
      return { port: existing.port, status: existing.ready ? 'ready' : 'starting' };
    }

    const port = await getPort({ port: [19006, 19007, 19008, 19009, 19010] });

    if (framework === 'react-native') {
      return this.startExpoPreview(projectId, projectPath, port);
    } else {
      return this.startFlutterPreview(projectId, projectPath, port);
    }
  }

  private async startExpoPreview(projectId: string, projectPath: string, port: number): Promise<{ port: number; status: string }> {
    const installStatus = await this.installNpmDeps(projectPath);
    if (!installStatus) return { port: 0, status: 'install_failed' };

    await this.ensureWebDeps(projectPath);

    console.log(`[preview:${projectId.slice(0, 8)}] Starting Expo web on port ${port}...`);

    const proc = spawn('npx', ['expo', 'start', '--web', '--port', String(port), '--clear'], {
      cwd: projectPath,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BROWSER: 'none', CI: '1' },
    });

    return this.trackServer(projectId, proc, 'react-native', port);
  }

  private async startFlutterPreview(projectId: string, projectPath: string, port: number): Promise<{ port: number; status: string }> {
    console.log(`[preview:${projectId.slice(0, 8)}] Starting Flutter web on port ${port}...`);

    // Check if flutter is available
    const flutterCheck = spawn('flutter', ['--version'], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const flutterAvailable = await new Promise<boolean>((resolve) => {
      flutterCheck.on('exit', (code) => resolve(code === 0));
      setTimeout(() => { flutterCheck.kill(); resolve(false); }, 10000);
    });

    if (!flutterAvailable) {
      console.log(`[preview:${projectId.slice(0, 8)}] Flutter not found, using static preview`);
      // Serve a static HTML preview for Flutter
      return this.startStaticFlutterPreview(projectId, projectPath, port);
    }

    const proc = spawn('flutter', ['run', '-d', 'web-server', '--web-port', String(port)], {
      cwd: projectPath,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return this.trackServer(projectId, proc, 'flutter', port);
  }

  private async startStaticFlutterPreview(projectId: string, projectPath: string, port: number): Promise<{ port: number; status: string }> {
    // Create a simple HTML preview showing the Flutter code
    const express = await import('express');
    const app = express.default();

    // Read main.dart and show it in a styled preview
    let dartCode = 'No main.dart found';
    try {
      dartCode = fs.readFileSync(path.join(projectPath, 'lib', 'main.dart'), 'utf-8');
    } catch {}

    app.get('/', (_req: any, res: any) => {
      res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Flutter Preview</title>
<style>
  body { margin:0; background:#1e1e2e; color:#cdd6f4; font-family:system-ui; display:flex; flex-direction:column; height:100vh; }
  .header { padding:16px 20px; background:#181825; border-bottom:1px solid #313244; display:flex; align-items:center; gap:8px; }
  .header svg { width:20px; height:20px; }
  .header h1 { font-size:14px; font-weight:600; }
  .badge { background:#45475a; color:#89b4fa; padding:2px 8px; border-radius:10px; font-size:11px; }
  .info { padding:20px; text-align:center; color:#6c7086; }
  .info p { margin:4px 0; font-size:13px; }
  pre { flex:1; overflow:auto; margin:0; padding:16px 20px; font-size:12px; line-height:1.6; background:#11111b; }
  code { color:#cdd6f4; }
  .keyword { color:#cba6f7; } .string { color:#a6e3a1; } .comment { color:#6c7086; } .type { color:#89b4fa; }
</style></head><body>
  <div class="header">
    <svg viewBox="0 0 24 24" fill="none" stroke="#89b4fa" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    <h1>Flutter Preview</h1>
    <span class="badge">Dart</span>
  </div>
  <div class="info">
    <p>Flutter SDK not found locally. Install Flutter to see live preview.</p>
    <p>Showing generated code below:</p>
  </div>
  <pre><code>${dartCode.replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/(import |class |void |final |const |return |if |else |Widget |State )/g, '<span class="keyword">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="comment">$1</span>')
    .replace(/('.*?')/g, '<span class="string">$1</span>')
  }</code></pre>
</body></html>`);
    });

    const server = app.listen(port, () => {
      console.log(`[preview:${projectId.slice(0, 8)}] Static Flutter preview on port ${port}`);
    });

    const fakeProc = { kill: () => server.close() } as any;
    this.servers.set(projectId, { port, process: fakeProc, framework: 'flutter', ready: true });

    return { port, status: 'ready' };
  }

  private trackServer(projectId: string, proc: ChildProcess, framework: string, port: number): Promise<{ port: number; status: string }> {
    const server: PreviewServer = { port, process: proc, framework, ready: false };
    this.servers.set(projectId, server);

    proc.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log(`[preview:${projectId.slice(0, 8)}] ${output.trim()}`);
      if (output.includes('Logs for your project') || output.includes('Waiting on') || output.includes('Web Bundl') || output.includes('web-server')) {
        server.ready = true;
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const errText = data.toString().trim();
      if (errText) console.error(`[preview:${projectId.slice(0, 8)}] ERR: ${errText}`);
      if (errText.includes('Waiting on') || errText.includes('Bundl')) {
        server.ready = true;
      }
    });

    proc.on('exit', (code) => {
      console.log(`[preview:${projectId.slice(0, 8)}] exited with code ${code}`);
      this.servers.delete(projectId);
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ port, status: server.ready ? 'ready' : 'starting' });
      }, 8000);
    });
  }

  async getPreview(projectId: string): Promise<{ port: number; status: string } | null> {
    const server = this.servers.get(projectId);
    if (!server) return null;
    return { port: server.port, status: server.ready ? 'ready' : 'starting' };
  }

  async stopPreview(projectId: string): Promise<void> {
    const server = this.servers.get(projectId);
    if (server) {
      server.process.kill();
      this.servers.delete(projectId);
    }
  }

  async restartPreview(projectId: string, framework: string, projectPath: string): Promise<{ port: number; status: string }> {
    await this.stopPreview(projectId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.startPreview(projectId, framework, projectPath);
  }

  private installNpmDeps(projectPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const nodeModulesPath = path.join(projectPath, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        console.log(`[preview] node_modules exists, skipping install`);
        resolve(true);
        return;
      }

      console.log(`[preview] Installing dependencies in ${projectPath}...`);
      const proc = spawn('npm', ['install'], {
        cwd: projectPath,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      proc.stdout?.on('data', (d: Buffer) => console.log(`[npm] ${d.toString().trim()}`));
      proc.stderr?.on('data', (d: Buffer) => console.log(`[npm] ${d.toString().trim()}`));
      proc.on('exit', (code) => {
        console.log(`[preview] npm install finished with code ${code}`);
        resolve(code === 0);
      });
      setTimeout(() => { proc.kill(); resolve(false); }, 120000);
    });
  }

  private ensureWebDeps(projectPath: string): Promise<void> {
    return new Promise((resolve) => {
      const metroRuntime = path.join(projectPath, 'node_modules', '@expo', 'metro-runtime');
      const expoAsset = path.join(projectPath, 'node_modules', 'expo-asset');
      if (fs.existsSync(metroRuntime) && fs.existsSync(expoAsset)) { resolve(); return; }

      console.log(`[preview] Installing web dependencies...`);
      const proc = spawn('npx', ['expo', 'install', '@expo/metro-runtime', 'expo-asset'], {
        cwd: projectPath, shell: true, stdio: ['ignore', 'pipe', 'pipe'],
      });
      proc.on('exit', () => resolve());
      setTimeout(() => { proc.kill(); resolve(); }, 60000);
    });
  }
}

export const previewManager = new PreviewManager();
