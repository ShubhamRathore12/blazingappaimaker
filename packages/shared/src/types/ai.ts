export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string | null;
  createdAt: string;
}

export type SSEEventType = 'text' | 'code' | 'file_write' | 'error' | 'done';

export interface SSEEvent {
  type: SSEEventType;
  data: string;
  filePath?: string;
}
