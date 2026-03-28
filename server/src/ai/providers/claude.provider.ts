import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMChatParams, LLMStreamEvent } from '../types.js';

export class ClaudeProvider implements LLMProvider {
  readonly name = 'claude';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async chat(params: LLMChatParams): Promise<string> {
    const { system, messages } = this.splitSystem(params.messages);
    const response = await this.client.messages.create({
      model: params.model ?? 'claude-sonnet-4-20250514',
      max_tokens: params.maxTokens ?? 8192,
      temperature: params.temperature,
      system: system || undefined,
      messages,
    });
    return response.content.map(b => b.type === 'text' ? b.text : '').join('');
  }

  async *chatStream(params: LLMChatParams): AsyncIterable<LLMStreamEvent> {
    const { system, messages } = this.splitSystem(params.messages);
    const stream = this.client.messages.stream({
      model: params.model ?? 'claude-sonnet-4-20250514',
      max_tokens: params.maxTokens ?? 8192,
      temperature: params.temperature,
      system: system || undefined,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text_delta', text: event.delta.text };
      }
    }
    yield { type: 'stop' };
  }

  private splitSystem(messages: LLMChatParams['messages']) {
    let system = '';
    const filtered: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const msg of messages) {
      if (msg.role === 'system') {
        system += (system ? '\n\n' : '') + msg.content;
      } else {
        filtered.push({ role: msg.role, content: msg.content });
      }
    }
    return { system, messages: filtered };
  }
}
