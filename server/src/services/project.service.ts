import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, schema } from '../db/index.js';
import { config } from '../config.js';
import { fileManager } from './fileManager.service.js';
import type { Framework } from '@lovable-clone/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(__dirname, '../../../templates');

export class ProjectService {
  async create(userId: string, name: string, framework: Framework, description?: string) {
    const id = nanoid();
    const storagePath = path.join(config.projectsRoot, id);

    // Copy template
    const templatePath = path.join(templatesDir, framework);
    await fileManager.ensureDir(config.projectsRoot);
    await fileManager.copyDir(templatePath, storagePath);

    await db.insert(schema.projects).values({
      id, userId, name, description: description || null, framework, storagePath,
    });

    // Create default conversation
    const convId = nanoid();
    await db.insert(schema.conversations).values({
      id: convId, projectId: id, title: 'Main',
    });

    return db.select().from(schema.projects).where(eq(schema.projects.id, id)).get();
  }

  async list(userId: string) {
    return db.select().from(schema.projects)
      .where(and(eq(schema.projects.userId, userId), eq(schema.projects.status, 'active')))
      .all();
  }

  async get(projectId: string, userId: string) {
    return db.select().from(schema.projects)
      .where(and(eq(schema.projects.id, projectId), eq(schema.projects.userId, userId)))
      .get();
  }

  async delete(projectId: string, userId: string) {
    await db.update(schema.projects)
      .set({ status: 'deleted' })
      .where(and(eq(schema.projects.id, projectId), eq(schema.projects.userId, userId)));
  }
}

export const projectService = new ProjectService();
