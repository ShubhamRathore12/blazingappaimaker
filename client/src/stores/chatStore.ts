import { create } from 'zustand';
import type { Conversation, Message } from '@lovable-clone/shared';
import * as aiApi from '../api/ai';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  streamingContent: string;
  streamingFiles: string[];
  isStreaming: boolean;
  loadConversations: (projectId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  setCurrentConversation: (conv: Conversation) => void;
  sendMessage: (content: string, provider?: string, onFileWrite?: (path: string) => void) => Promise<void>;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  streamingContent: '',
  streamingFiles: [],
  isStreaming: false,

  loadConversations: async (projectId) => {
    let conversations = await aiApi.getConversations(projectId);
    if (conversations.length === 0) {
      const newConv = await aiApi.createConversation(projectId);
      conversations = [newConv];
    }
    set({ conversations, currentConversation: conversations[0], messages: [] });
    await get().loadMessages(conversations[0].id);
  },

  loadMessages: async (conversationId) => {
    const messages = await aiApi.getMessages(conversationId);
    set({ messages });
  },

  setCurrentConversation: (conv) => set({ currentConversation: conv }),

  resetChat: () => {
    set({
      currentConversation: null,
      messages: [],
      streamingContent: '',
      streamingFiles: [],
      isStreaming: false,
    });
  },

  sendMessage: async (content, provider, onFileWrite) => {
    const { currentConversation, messages } = get();
    if (!currentConversation) return;

    // Add user message optimistically
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: currentConversation.id,
      role: 'user',
      content,
      metadata: null,
      createdAt: new Date().toISOString(),
    };
    set({ messages: [...messages, userMsg], isStreaming: true, streamingContent: '', streamingFiles: [] });

    let fullContent = '';

    await aiApi.streamMessage(currentConversation.id, content, provider, (event) => {
      if (event.type === 'text') {
        fullContent += event.data;
        set({ streamingContent: fullContent });
      } else if (event.type === 'error') {
        const errorMsg: Message = {
          id: `temp-${Date.now()}-error`,
          conversationId: currentConversation.id,
          role: 'assistant',
          content: `**Error:** ${event.data}`,
          metadata: null,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, errorMsg],
          streamingContent: '',
          isStreaming: false,
        }));
      } else if (event.type === 'file_write' && event.filePath) {
        set((s) => ({ streamingFiles: [...s.streamingFiles, event.filePath!] }));
        onFileWrite?.(event.filePath);
      } else if (event.type === 'done') {
        const { streamingFiles } = get();
        const assistantMsg: Message = {
          id: `temp-${Date.now()}-assistant`,
          conversationId: currentConversation.id,
          role: 'assistant',
          content: fullContent,
          metadata: streamingFiles.length > 0 ? JSON.stringify({ filesWritten: streamingFiles }) : null,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, assistantMsg],
          streamingContent: '',
          streamingFiles: [],
          isStreaming: false,
        }));
      }
    });
  },
}));
