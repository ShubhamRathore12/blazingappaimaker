import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  framework: z.enum(['react-native', 'flutter']),
});

export const createBuildSchema = z.object({
  platform: z.enum(['android', 'ios']),
});

export const createDeploySchema = z.object({
  store: z.enum(['play-store', 'app-store']),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  provider: z.string().optional(),
});
