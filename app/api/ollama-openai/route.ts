import { streamText } from 'ai';
import { ollama } from 'ollama-ai-provider';
import { NextRequest } from 'next/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    console.log('=== OLLAMA AI PROVIDER ===');
    
    const body = await request.json();
    console.log('Request body keys:', Object.keys(body));
    
    const { messages, selectedChatModel = 'MasterKey:latest' } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 });
    }

    console.log('Using model:', selectedChatModel);
    console.log('Messages count:', messages.length);

    // Converter mensagens para formato esperado
    const formattedMessages = messages.map((msg: any) => {
      let content = '';
      
      if (typeof msg.content === 'string') {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        content = msg.content
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join(' ');
      } else if (msg.parts) {
        content = msg.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join(' ');
      }

      return {
        role: msg.role,
        content: content || 'Empty message',
      };
    });

    console.log('Formatted messages:', formattedMessages);

    // Usar o provedor Ollama oficial
    const result = await streamText({
      model: ollama(selectedChatModel),
      messages: formattedMessages,
    });

    console.log('Streaming response from Ollama AI Provider...');
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Ollama AI Provider error:', error);
    
    // Fallback para nossa implementação manual
    console.log('Falling back to manual implementation...');
    return await manualOllamaStream(request);
  }
}

async function manualOllamaStream(request: NextRequest) {
  const body = await request.json();
  const { messages, selectedChatModel = 'MasterKey:latest' } = body;

  const lastMessage = messages[messages.length - 1];
  let prompt = '';
  
  if (typeof lastMessage.content === 'string') {
    prompt = lastMessage.content;
  } else if (Array.isArray(lastMessage.content)) {
    prompt = lastMessage.content
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join(' ');
  } else if (lastMessage.parts) {
    prompt = lastMessage.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join(' ');
  }

  console.log('Manual stream - prompt:', prompt);

  const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: selectedChatModel,
      prompt,
      stream: true,
    }),
  });

  if (!ollamaResponse.ok) {
    throw new Error(`Ollama error: ${ollamaResponse.status}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const reader = ollamaResponse.body?.getReader();
        if (!reader) throw new Error('No reader available');

        let messageId = `msg-${Date.now()}`;
        
        // Inicializar stream AI SDK
        controller.enqueue(encoder.encode(`1:"${messageId}"\n`));
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                const text = data.response
                  .replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n');
                controller.enqueue(encoder.encode(`0:"${text}"\n`));
              }
              if (data.done) {
                controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
                controller.close();
                return;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
        
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
        controller.close();
        
      } catch (error) {
        console.error('Manual stream error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
      'Cache-Control': 'no-cache',
    },
  });
}
