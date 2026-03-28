import OpenAI from 'openai';
import type { LLMProvider, LLMChatParams, LLMStreamEvent } from '../types.js';

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async chat(params: LLMChatParams): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: params.model ?? 'gpt-4o',
      max_tokens: params.maxTokens ?? 8192,
      temperature: params.temperature,
      messages: params.messages.map(m => ({ role: m.role, content: m.content })),
    });
    return response.choices[0]?.message?.content || '';
  }

  async *chatStream(params: LLMChatParams): AsyncIterable<LLMStreamEvent> {
    const stream = await this.client.chat.completions.create({
      model: params.model ?? 'gpt-4o',
      max_tokens: params.maxTokens ?? 8192,
      temperature: params.temperature,
      messages: params.messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield { type: 'text_delta', text: delta };
      }
    }
    yield { type: 'stop' };
  }
}
