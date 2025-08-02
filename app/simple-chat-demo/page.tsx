'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimpleChatDemo() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; id: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: input,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/new-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `chat-${Date.now()}`,
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
      let assistantMessageId = `assistant-${Date.now()}`;

      // Add assistant message placeholder
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      }]);

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
                
                // Update assistant message
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (updated[lastIndex]?.role === 'assistant') {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: assistantResponse,
                    };
                  }
                  return updated;
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Chat com Ollama - MasterKey:latest</h1>
      
      <div className="space-y-4">
        {/* Messages */}
        <Card className="h-96 overflow-y-auto">
          <CardContent className="p-4 space-y-4">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">Nenhuma mensagem ainda. Comece uma conversa!</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {message.role === 'user' ? 'Você' : 'MasterKey'}
                    </div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg max-w-[80%]">
                  <div className="text-xs opacity-70 mb-1">MasterKey</div>
                  <div className="animate-pulse">Escrevendo...</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Enviar Mensagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              onKeyDown={handleKeyPress}
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !input.trim()}
                className="flex-1"
              >
                {isLoading ? 'Enviando...' : 'Enviar'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setMessages([])}
                disabled={isLoading}
              >
                Limpar Chat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">
              <p><strong>Status:</strong> {isLoading ? 'Carregando...' : 'Pronto'}</p>
              <p><strong>Modelo:</strong> MasterKey:latest</p>
              <p><strong>Endpoint:</strong> /api/new-chat</p>
              <p><strong>Mensagens:</strong> {messages.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
