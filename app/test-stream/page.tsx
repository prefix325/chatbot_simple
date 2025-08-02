'use client';

import { useState } from 'react';

export default function TestStreamPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const testStream = async () => {
    try {
      setLoading(true);
      setError('');
      setResponse('');

      console.log('Starting stream test...');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `test-${Date.now()}`,
          messages: [{ role: 'user', content: message }],
          selectedChatModel: 'chat-model'
        }),
      });

      console.log('Response received:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries())
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream available');
      }

      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        console.log('Stream chunk received:', chunk);
        fullResponse += chunk;
        setResponse(fullResponse);
      }

      console.log('Stream completed successfully');
      
    } catch (err) {
      console.error('Stream test error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Stream Test</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Test Message:</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter test message"
        />
      </div>

      <button
        onClick={testStream}
        disabled={loading || !message}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Stream'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <h3 className="font-bold text-red-700">Error:</h3>
          <pre className="mt-2 text-red-600">{error}</pre>
        </div>
      )}

      {response && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
          <h3 className="font-bold text-green-700">Response:</h3>
          <pre className="mt-2 text-green-600 whitespace-pre-wrap">{response}</pre>
        </div>
      )}
    </div>
  );
}
