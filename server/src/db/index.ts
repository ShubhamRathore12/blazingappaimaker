import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use Turso cloud URL if provided, otherwise fall back to local SQLite file
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const client = tursoUrl
  ? createClient({ url: tursoUrl, authToken: tursoToken })
  : createClient({
      url: `file:${
        process.env.DATABASE_PATH
          ? path.resolve(process.env.DATABASE_PATH)
          : path.resolve(__dirname, '../../../lovable-clone.db')
      }`,
    });

export const db = drizzle(client, { schema });
export { schema };
