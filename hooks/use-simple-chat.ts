'use client';

import { useState, useCallback } from 'react';
import type { UIMessage } from 'ai';

export function useSimpleChat({
  id,
  initialMessages = [],
  onFinish,
  onError,
}: {
  id: string;
  initialMessages?: UIMessage[];
  onFinish?: () => void;
  onError?: (error: Error) => void;
}) {
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'streaming'>('idle');

  const append = useCallback(async (message: UIMessage) => {
    const newMessages = [...messages, message];
    setMessages(newMessages);
    setStatus('streaming');

    try {
      const response = await fetch('/api/new-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          messages: newMessages,
          selectedChatModel: 'MasterKey:latest',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
      let assistantMessageId = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('1:')) {
              // Message ID
              const idMatch = line.match(/1:"(.*)"/);
              if (idMatch) {
                assistantMessageId = idMatch[1];
              }
            } else if (line.startsWith('0:')) {
              // Content chunk
              const textMatch = line.match(/0:"(.*)"/);
              if (textMatch) {
                const text = textMatch[1]
                  .replace(/\\"/g, '"')
                  .replace(/\\n/g, '\n')
                  .replace(/\\\\/g, '\\');
                assistantResponse += text;
                
                // Update messages with current response
                setMessages(prev => {
                  const lastIndex = prev.length - 1;
                  const lastMessage = prev[lastIndex];
                  
                  if (lastMessage?.role === 'assistant') {
                    // Update existing assistant message
                    const updated = [...prev];
                    updated[lastIndex] = {
                      ...lastMessage,
                      content: assistantResponse,
                    };
                    return updated;
                  } else {
                    // Add new assistant message
                    return [...prev, {
                      id: assistantMessageId || `assistant-${Date.now()}`,
                      role: 'assistant',
                      content: assistantResponse,
                      createdAt: new Date(),
                      parts: [{ type: 'text', text: assistantResponse }],
                    } as UIMessage];
                  }
                });
              }
            } else if (line.startsWith('d:')) {
              // Done marker
              console.log('Stream finished');
            }
          }
        }
      }

      setStatus('idle');
      onFinish?.();
      
    } catch (error) {
      console.error('Chat error:', error);
      setStatus('idle');
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [id, messages, onFinish, onError]);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || status === 'streaming') return;

    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      createdAt: new Date(),
      parts: [{ type: 'text', text: input }],
    };

    setInput('');
    append(userMessage);
  }, [input, status, append]);

  const stop = useCallback(() => {
    setStatus('idle');
  }, []);

  const reload = useCallback(() => {
    if (messages.length === 0) return;
    
    // Remove last assistant message and resend last user message
    const lastUserMessageIndex = messages.findLastIndex(m => m.role === 'user');
    if (lastUserMessageIndex === -1) return;

    const messagesToKeep = messages.slice(0, lastUserMessageIndex + 1);
    const lastUserMessage = messages[lastUserMessageIndex];
    
    setMessages(messagesToKeep);
    append(lastUserMessage);
  }, [messages, append]);

  return {
    messages,
    setMessages,
    input,
    setInput,
    handleSubmit,
    append,
    reload,
    stop,
    status,
  };
}
