export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMStreamEvent {
  type: 'text_delta' | 'stop';
  text?: string;
}

export interface LLMChatParams {
  messages: LLMMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMProvider {
  readonly name: string;
  chat(params: LLMChatParams): Promise<string>;
  chatStream(params: LLMChatParams): AsyncIterable<LLMStreamEvent>;
}
