import { Router, Response } from 'express';
import { sendMessageSchema } from '@lovable-clone/shared';
import { validate } from '../middleware/validate.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { aiService } from '../services/ai.service.js';
import { projectService } from '../services/project.service.js';
import { aiRegistry } from '../ai/registry.js';

const router = Router();
router.use(authMiddleware);

// List AI providers
router.get('/providers', (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: aiRegistry.list() });
});

// Get conversations for a project
router.get('/projects/:projectId/conversations', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.projectId, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  const conversations = await aiService.getConversations(project.id);
  res.json({ success: true, data: conversations });
});

// Create conversation
router.post('/projects/:projectId/conversations', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.projectId, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  const conversation = await aiService.createConversation(project.id, req.body.title);
  res.json({ success: true, data: conversation });
});

// Get messages
router.get('/conversations/:convId/messages', async (req: AuthRequest, res: Response) => {
  const messages = await aiService.getMessages(req.params.convId);
  res.json({ success: true, data: messages });
});

// Send message (SSE streaming)
router.post('/conversations/:convId/messages', validate(sendMessageSchema), async (req: AuthRequest, res: Response) => {
  const { content, provider } = req.body;

  // Find the conversation's project
  const conv = await aiService.getMessages(req.params.convId);
  // We need to look up the conversation to get the project
  const conversations = await aiService.getConversations('');
  // Simpler: lookup from DB directly
  const { db, schema } = await import('../db/index.js');
  const { eq } = await import('drizzle-orm');

  const [conversation] = await db.select().from(schema.conversations)
    .where(eq(schema.conversations.id, req.params.convId));

  if (!conversation) {
    res.status(404).json({ success: false, error: 'Conversation not found' });
    return;
  }

  const project = await projectService.get(conversation.projectId, req.userId!);
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    const stream = aiService.streamMessage(
      req.params.convId,
      content,
      project.framework as any,
      project.storagePath,
      provider
    );

    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', data: err.message })}\n\n`);
  }

  res.end();
});

export default router;
