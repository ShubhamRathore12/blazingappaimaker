import Groq from 'groq-sdk';
import type { LLMProvider, LLMChatParams, LLMStreamEvent } from '../types.js';

export class GroqProvider implements LLMProvider {
  readonly name = 'groq';
  private client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async chat(params: LLMChatParams): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: params.model ?? 'llama-3.3-70b-versatile',
      max_tokens: params.maxTokens ?? 8192,
      temperature: params.temperature,
      messages: params.messages.map(m => ({ role: m.role, content: m.content })),
    });
    return response.choices[0]?.message?.content || '';
  }

  async *chatStream(params: LLMChatParams): AsyncIterable<LLMStreamEvent> {
    const stream = await this.client.chat.completions.create({
      model: params.model ?? 'llama-3.3-70b-versatile',
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
