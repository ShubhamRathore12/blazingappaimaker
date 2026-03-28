import fs from 'fs/promises';
import path from 'path';
import type { FileNode } from '@lovable-clone/shared';

export class FileManagerService {
  async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async readTree(rootPath: string, relativeTo?: string): Promise<FileNode[]> {
    const base = relativeTo || rootPath;
    const entries = await fs.readdir(rootPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const fullPath = path.join(rootPath, entry.name);
      const relPath = path.relative(base, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        const children = await this.readTree(fullPath, base);
        nodes.push({ name: entry.name, path: relPath, type: 'directory', children });
      } else {
        nodes.push({ name: entry.name, path: relPath, type: 'file' });
      }
    }

    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  async readFile(rootPath: string, filePath: string): Promise<string> {
    const resolved = this.resolveSafe(rootPath, filePath);
    return fs.readFile(resolved, 'utf-8');
  }

  async writeFile(rootPath: string, filePath: string, content: string): Promise<void> {
    const resolved = this.resolveSafe(rootPath, filePath);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, content, 'utf-8');
  }

  async deleteFile(rootPath: string, filePath: string): Promise<void> {
    const resolved = this.resolveSafe(rootPath, filePath);
    await fs.unlink(resolved);
  }

  async copyDir(src: string, dest: string): Promise<void> {
    await fs.cp(src, dest, { recursive: true });
  }

  private resolveSafe(rootPath: string, filePath: string): string {
    const resolved = path.resolve(rootPath, filePath);
    if (!resolved.startsWith(path.resolve(rootPath))) {
      throw new Error('Path traversal detected');
    }
    return resolved;
  }
}

export const fileManager = new FileManagerService();
