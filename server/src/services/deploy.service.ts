import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import type { DeployStore } from '@lovable-clone/shared';

export class DeployService {
  async create(buildId: string, store: DeployStore) {
    const id = nanoid();
    await db.insert(schema.deployments).values({ id, buildId, store });
    // Simulate deployment
    this.simulateDeploy(id, store);
    return db.select().from(schema.deployments).where(eq(schema.deployments.id, id)).get();
  }

  async get(deployId: string) {
    return db.select().from(schema.deployments)
      .where(eq(schema.deployments.id, deployId))
      .get();
  }

  private async simulateDeploy(deployId: string, store: DeployStore) {
    await db.update(schema.deployments)
      .set({ status: 'uploading' })
      .where(eq(schema.deployments.id, deployId));

    setTimeout(async () => {
      await db.update(schema.deployments)
        .set({
          status: 'submitted',
          storeUrl: store === 'play-store'
            ? 'https://play.google.com/store/apps/details?id=com.example.app'
            : 'https://apps.apple.com/app/example/id123456789',
        })
        .where(eq(schema.deployments.id, deployId));
    }, 3000);
  }
}

export const deployService = new DeployService();
