import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Chat Compatible - Request received');
    
    const body = await request.json();
    console.log('Chat Compatible - Body keys:', Object.keys(body));
    
    const { messages, selectedChatModel = 'MasterKey:latest' } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Last message must be from user', { status: 400 });
    }

    const userText = lastMessage.content || '';
    console.log('Chat Compatible - User text:', userText);

    // Fazer streaming direto do Ollama
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedChatModel,
        prompt: userText,
        stream: true,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama responded with status: ${ollamaResponse.status}`);
    }

    console.log('Chat Compatible - Streaming response from Ollama');

    // Criar stream compatível com o useChat
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = ollamaResponse.body?.getReader();
          if (!reader) {
            throw new Error('No reader available');
          }

          let fullResponse = '';
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.response) {
                  fullResponse += data.response;
                  
                  // Formato compatível com AI SDK
                  const streamData = `0:"${data.response.replace(/"/g, '\\"')}"\n`;
                  controller.enqueue(encoder.encode(streamData));
                }
              } catch (e) {
                console.log('Chat Compatible - Parse error:', e);
              }
            }
          }

          // Finalizar stream
          const finishData = `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`;
          controller.enqueue(encoder.encode(finishData));
          
          console.log('Chat Compatible - Stream finished, full response:', fullResponse);
          controller.close();
          
        } catch (error) {
          console.error('Chat Compatible - Stream error:', error);
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

  } catch (error) {
    console.error('Chat Compatible - Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    status: 'Chat Compatible API is working',
    model: 'MasterKey:latest',
    timestamp: new Date().toISOString(),
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
