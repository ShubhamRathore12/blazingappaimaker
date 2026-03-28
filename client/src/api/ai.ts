import api from './client';
import type { Conversation, Message } from '@lovable-clone/shared';

export async function getConversations(projectId: string): Promise<Conversation[]> {
  const res = await api.get(`/ai/projects/${projectId}/conversations`);
  return res.data.data;
}

export async function createConversation(projectId: string, title?: string): Promise<Conversation> {
  const res = await api.post(`/ai/projects/${projectId}/conversations`, { title: title || 'Main' });
  return res.data.data;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const res = await api.get(`/ai/conversations/${conversationId}/messages`);
  return res.data.data;
}

export function streamMessage(
  conversationId: string,
  content: string,
  provider?: string,
  onEvent?: (event: { type: string; data: string; filePath?: string }) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    fetch(`${apiBase}/ai/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, provider }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Stream request failed');
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                onEvent?.(event);
              } catch {}
            }
          }
        }
        resolve();
      })
      .catch(reject);
  });
}
