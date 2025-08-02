'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestChat() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('/api/new-chat');

  const routes = [
    { value: '/api/new-chat', label: 'New Chat (AI SDK Compatible)' },
    { value: '/api/ultra-simple-chat', label: 'Ultra Simple Chat' },
    { value: '/api/chat-compatible', label: 'Chat Compatible' },
    { value: '/api/fixed-chat', label: 'Fixed Chat' },
    { value: '/api/simple-chat', label: 'Simple Chat' },
    { value: '/api/chat', label: 'Original Chat' },
  ];

  const testRoute = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    
    try {
      const body = {
        id: `test-${Date.now()}`,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        selectedChatModel: 'MasterKey:latest',
      };

      console.log('Sending to:', selectedRoute);
      console.log('Body:', body);

      const response = await fetch(selectedRoute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if it's a stream
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/plain')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            console.log('Stream chunk:', chunk);
            
            // Parse AI SDK stream format
            const lines = chunk.split('\n').filter(line => line.trim());
            for (const line of lines) {
              if (line.startsWith('0:')) {
                const textMatch = line.match(/0:"(.*)"/);
                if (textMatch) {
                  const text = textMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
                  fullText += text;
                  setResponse(fullText);
                }
              }
            }
          }
        }
      } else {
        // Handle JSON response
        const data = await response.json();
        console.log('JSON Response:', data);
        setResponse(data.response || JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Test error:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testStatus = async () => {
    try {
      const response = await fetch(selectedRoute, { method: 'GET' });
      const data = await response.json();
      setResponse(`Status: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResponse(`Status Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Chat API Tester</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Route Selection</CardTitle>
            <CardDescription>Choose which API route to test</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {routes.map((route) => (
                <Button
                  key={route.value}
                  variant={selectedRoute === route.value ? 'default' : 'outline'}
                  onClick={() => setSelectedRoute(route.value)}
                >
                  {route.label}
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">Selected: {selectedRoute}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message Input</CardTitle>
            <CardDescription>Enter your message to send to the Ollama model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && testRoute()}
            />
            <div className="flex gap-2">
              <Button onClick={testRoute} disabled={isLoading || !message.trim()}>
                {isLoading ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
              <Button variant="outline" onClick={testStatus}>
                Testar Status (GET)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardDescription>Response from the selected API route</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg min-h-[200px] whitespace-pre-wrap">
              {response || 'Nenhuma resposta ainda...'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
