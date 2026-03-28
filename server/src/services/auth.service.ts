import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { config } from '../config.js';

export class AuthService {
  async signup(email: string, password: string, name: string) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    if (existing) {
      throw new Error('Email already registered');
    }

    const id = nanoid();
    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(schema.users).values({ id, email, passwordHash, name });

    const user = await db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    const token = this.generateToken(id);

    return {
      token,
      user: { id: user!.id, email: user!.email, name: user!.name, createdAt: user!.createdAt, updatedAt: user!.updatedAt },
    };
  }

  async login(email: string, password: string) {
    const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user.id);
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, updatedAt: user.updatedAt },
    };
  }

  async getUser(userId: string) {
    const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, updatedAt: user.updatedAt };
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
  }
}

export const authService = new AuthService();
