import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import type { BuildPlatform } from '@lovable-clone/shared';

export class BuildService {
  async create(projectId: string, platform: BuildPlatform) {
    const id = nanoid();
    await db.insert(schema.builds).values({ id, projectId, platform });
    // In a real system, this would enqueue a build job
    // For MVP, we simulate the build process
    this.simulateBuild(id);
    return db.select().from(schema.builds).where(eq(schema.builds.id, id)).get();
  }

  async list(projectId: string) {
    return db.select().from(schema.builds)
      .where(eq(schema.builds.projectId, projectId))
      .all();
  }

  async get(buildId: string) {
    return db.select().from(schema.builds)
      .where(eq(schema.builds.id, buildId))
      .get();
  }

  private async simulateBuild(buildId: string) {
    // Simulate build starting
    await db.update(schema.builds)
      .set({ status: 'building', startedAt: new Date().toISOString() })
      .where(eq(schema.builds.id, buildId));

    // Simulate build completing after delay
    setTimeout(async () => {
      await db.update(schema.builds)
        .set({
          status: 'success',
          completedAt: new Date().toISOString(),
          buildLog: 'Build completed successfully.\nAPK generated at: build/output/app-release.apk',
          artifactUrl: `/api/builds/${buildId}/download`,
        })
        .where(eq(schema.builds.id, buildId));
    }, 5000);
  }
}

export const buildService = new BuildService();
