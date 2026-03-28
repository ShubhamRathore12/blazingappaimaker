import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, LLMChatParams, LLMStreamEvent } from '../types.js';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async chat(params: LLMChatParams): Promise<string> {
    const { system, history, lastMessage } = this.convertMessages(params.messages);

    const model = this.client.getGenerativeModel({
      model: params.model ?? 'gemini-2.0-flash',
      ...(system ? { systemInstruction: { role: 'user', parts: [{ text: system }] } } : {}),
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    return result.response.text();
  }

  async *chatStream(params: LLMChatParams): AsyncIterable<LLMStreamEvent> {
    const { system, history, lastMessage } = this.convertMessages(params.messages);

    const model = this.client.getGenerativeModel({
      model: params.model ?? 'gemini-2.0-flash',
      ...(system ? { systemInstruction: { role: 'user', parts: [{ text: system }] } } : {}),
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield { type: 'text_delta', text };
      }
    }
    yield { type: 'stop' };
  }

  private convertMessages(messages: LLMChatParams['messages']) {
    let system = '';
    const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    let lastMessage = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        system += (system ? '\n\n' : '') + msg.content;
      } else {
        history.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Pop the last user message to send separately
    if (history.length > 0 && history[history.length - 1].role === 'user') {
      const last = history.pop()!;
      lastMessage = last.parts[0].text;
    }

    return { system, history, lastMessage };
  }
}
