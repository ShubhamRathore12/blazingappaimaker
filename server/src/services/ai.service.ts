import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { aiRegistry } from '../ai/registry.js';
import { buildSystemPrompt, buildMessages } from '../ai/promptBuilder.js';
import { parseCodeBlocks } from '../ai/codeParser.js';
import { fileManager } from './fileManager.service.js';
import type { Framework } from '@lovable-clone/shared';

export class AIService {
  async getConversations(projectId: string) {
    return db.select().from(schema.conversations)
      .where(eq(schema.conversations.projectId, projectId))
      .all();
  }

  async getMessages(conversationId: string) {
    return db.select().from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId))
      .all();
  }

  async createConversation(projectId: string, title?: string) {
    const id = nanoid();
    await db.insert(schema.conversations).values({ id, projectId, title: title || 'New Chat' });
    return db.select().from(schema.conversations).where(eq(schema.conversations.id, id)).get();
  }

  async *streamMessage(
    conversationId: string,
    userContent: string,
    framework: Framework,
    storagePath: string,
    providerName?: string
  ): AsyncGenerator<{ type: string; data: string; filePath?: string }> {
    // Save user message
    const userMsgId = nanoid();
    await db.insert(schema.messages).values({
      id: userMsgId, conversationId, role: 'user', content: userContent,
    });

    // Load history
    const history = await db.select().from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId))
      .all();

    // Build file tree string
    const tree = await fileManager.readTree(storagePath);
    const treeStr = this.formatTree(tree);

    // Build prompt
    const systemPrompt = buildSystemPrompt(framework, treeStr);
    const messages = buildMessages(
      systemPrompt,
      history.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
      userContent
    );

    // Stream from AI
    const provider = providerName ? aiRegistry.get(providerName) : aiRegistry.getDefault();
    let fullResponse = '';

    for await (const event of provider.chatStream({ messages, maxTokens: 32768 })) {
      if (event.type === 'text_delta' && event.text) {
        fullResponse += event.text;
        yield { type: 'text', data: event.text };
      }
    }

    // Parse code blocks and write files
    const codeBlocks = parseCodeBlocks(fullResponse);
    for (const block of codeBlocks) {
      await fileManager.writeFile(storagePath, block.filePath, block.content);
      yield { type: 'file_write', data: block.filePath, filePath: block.filePath };
    }

    // Save assistant message
    const assistantMsgId = nanoid();
    await db.insert(schema.messages).values({
      id: assistantMsgId, conversationId, role: 'assistant', content: fullResponse,
      metadata: JSON.stringify({ filesWritten: codeBlocks.map(b => b.filePath) }),
    });

    yield { type: 'done', data: '' };
  }

  private formatTree(nodes: Array<{ name: string; path: string; type: string; children?: any[] }>, indent = ''): string {
    let result = '';
    for (const node of nodes) {
      result += `${indent}${node.type === 'directory' ? '📁' : '📄'} ${node.name}\n`;
      if (node.children) {
        result += this.formatTree(node.children, indent + '  ');
      }
    }
    return result;
  }
}

export const aiService = new AIService();
