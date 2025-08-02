'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';

export default function ChatDebugPage() {
  const [message, setMessage] = useState('Olá, como você está?');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (log: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toISOString()}: ${log}`]);
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload,
    status
  } = useChat({
    api: '/api/chat',
    id: 'debug-chat',
    initialMessages: [],
    body: {
      id: 'debug-chat',
      selectedChatModel: 'MasterKey:latest'
    },
    onFinish: (message) => {
      addLog(`Chat finished. Message: ${message.content.substring(0, 50)}...`);
      toast.success('Chat concluído com sucesso!');
    },
    onError: (error) => {
      addLog(`Error occurred: ${error.message}`);
      toast.error(`Erro: ${error.message}`);
    },
    onResponse: (response) => {
      addLog(`Response received: ${response.status} ${response.statusText}`);
    },
  });

  const testDirectAPI = async () => {
    addLog('Testing direct API call...');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'direct-test',
          messages: [
            { role: 'user', content: message }
          ],
          selectedChatModel: 'MasterKey:latest'
        }),
      });

      addLog(`Direct API response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        addLog(`Error response: ${errorData}`);
        toast.error(`API Error: ${response.status}`);
        return;
      }

      // Read stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          streamContent += chunk;
        }
      }

      addLog(`Stream completed. Length: ${streamContent.length}`);
      toast.success('Direct API test successful!');
      
    } catch (error) {
      addLog(`Direct API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Direct API test failed');
    }
  };

  const testOllamaHealth = async () => {
    addLog('Testing Ollama health...');
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      addLog(`Ollama status: ${JSON.stringify(data, null, 2)}`);
      toast.success('Status check completed');
    } catch (error) {
      addLog(`Status check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Status check failed');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Chat Debug Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Debug Controls</h2>
          <p className="text-sm text-gray-600 mb-4">
            Status: {status} | Loading: {isLoading ? 'Yes' : 'No'} | Error: {error ? 'Yes' : 'No'}
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Message:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem de teste..."
                rows={3}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button onClick={testOllamaHealth} className="px-4 py-2 border rounded hover:bg-gray-50">
                Test Status
              </button>
              <button onClick={testDirectAPI} className="px-4 py-2 border rounded hover:bg-gray-50">
                Test Direct API
              </button>
              <button onClick={() => setDebugLogs([])} className="px-4 py-2 border rounded hover:bg-gray-50">
                Clear Logs
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                value={input}
                placeholder="Use useChat hook..."
                onChange={handleInputChange}
                disabled={isLoading}
                rows={2}
                className="w-full p-2 border rounded"
              />
              <button 
                type="submit" 
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isLoading ? 'Enviando...' : 'Send via useChat'}
              </button>
              {isLoading && (
                <button 
                  type="button" 
                  onClick={stop} 
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-2"
                >
                  Stop
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Debug Logs</h2>
          <p className="text-sm text-gray-600 mb-4">Real-time debugging information</p>
          
          <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto text-sm font-mono">
            {debugLogs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="border rounded-lg p-4 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-2">Chat Messages</h2>
          <p className="text-sm text-gray-600 mb-4">Messages from useChat hook</p>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages yet...</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="p-2 border rounded">
                  <div className="font-medium text-sm">
                    {message.role === 'user' ? '👤 User' : '🤖 Assistant'}
                  </div>
                  <div className="mt-1">{message.content}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
