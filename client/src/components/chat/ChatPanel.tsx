import { useEffect, useRef, useState, useMemo } from 'react';
import { Send, AlertCircle, FileCode, Bot, User, CheckCircle2 } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  projectId: string;
  onFileWrite: (filePath?: string) => void;
}

function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

function FilesWrittenBadge({ metadata }: { metadata: string | null }) {
  const files = useMemo(() => {
    if (!metadata) return [];
    try {
      const parsed = JSON.parse(metadata);
      return parsed.filesWritten || [];
    } catch { return []; }
  }, [metadata]);

  if (files.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-dark-700">
      <div className="flex items-center gap-1 text-[10px] text-dark-500 mb-1.5">
        <CheckCircle2 className="w-3 h-3 text-green-500" />
        <span>{files.length} file{files.length > 1 ? 's' : ''} written</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {files.map((f: string) => (
          <span
            key={f}
            className="inline-flex items-center gap-1 bg-dark-700/60 text-dark-300 text-[10px] px-2 py-0.5 rounded-md"
          >
            <FileCode className="w-2.5 h-2.5 text-primary-400" />
            {getFileName(f)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ChatPanel({ projectId, onFileWrite }: ChatPanelProps) {
  const { messages, streamingContent, streamingFiles, isStreaming, sendMessage } = useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const content = input;
    setInput('');
    await sendMessage(content, undefined, (filePath) => onFileWrite(filePath));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-950">
      <div className="px-4 py-3 border-b border-dark-800 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary-500" />
          <h2 className="text-sm font-semibold">AI Chat</h2>
        </div>
        <p className="text-xs text-dark-500 mt-0.5">Describe what you want to build</p>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-12">
            <Bot className="w-10 h-10 text-dark-700 mx-auto mb-3" />
            <p className="text-sm text-dark-400 font-medium">Start building your app</p>
            <div className="mt-4 space-y-2">
              {['Build a todo app with categories', 'Create a weather app', 'Make a recipe book app'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); }}
                  className="block w-full text-left text-xs text-dark-500 hover:text-white bg-dark-900 hover:bg-dark-800 rounded-lg px-3 py-2 transition"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-3 h-3 text-primary-400" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white'
                : msg.content.startsWith('**Error:')
                  ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                  : 'bg-dark-800 text-dark-200'
            }`}>
              {msg.role === 'assistant' ? (
                msg.content.startsWith('**Error:') ? (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs">{msg.content.replace('**Error:** ', '')}</p>
                  </div>
                ) : (
                  <>
                    <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-dark-900 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:overflow-x-auto [&_code]:text-xs [&_p]:leading-relaxed [&_p]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <FilesWrittenBadge metadata={msg.metadata} />
                  </>
                )
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center shrink-0 mt-1">
                <User className="w-3 h-3 text-dark-300" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming response */}
        {isStreaming && streamingContent && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-3 h-3 text-primary-400 animate-pulse" />
            </div>
            <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-dark-800 text-dark-200">
              <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-dark-900 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:overflow-x-auto [&_code]:text-xs [&_p]:leading-relaxed [&_p]:my-1">
                <ReactMarkdown>{streamingContent}</ReactMarkdown>
              </div>
              {streamingFiles.length > 0 && (
                <div className="mt-2 pt-2 border-t border-dark-700">
                  <div className="flex items-center gap-1 text-[10px] text-green-400 mb-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Writing files...</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {streamingFiles.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 bg-green-500/10 text-green-300 text-[10px] px-2 py-0.5 rounded-md border border-green-500/20">
                        <FileCode className="w-2.5 h-2.5" />
                        {getFileName(f)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading dots */}
        {isStreaming && !streamingContent && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-primary-400 animate-pulse" />
            </div>
            <div className="bg-dark-800 rounded-xl px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-dark-800 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            rows={2}
            className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-dark-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-30 disabled:hover:bg-primary-600 text-white p-2.5 rounded-xl transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-dark-600 mt-1.5 text-center">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}
