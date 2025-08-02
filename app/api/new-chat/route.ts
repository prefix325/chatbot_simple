import { NextRequest } from 'next/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    console.log('=== NEW CHAT API ===');
    console.log('Request received at:', new Date().toISOString());
    
    const body = await request.json();
    console.log('Request body keys:', Object.keys(body));
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { 
      id, 
      messages, 
      selectedChatModel = 'MasterKey:latest' 
    } = body;
    
    if (!messages || !Array.isArray(messages)) {
      console.error('No messages array found');
      return new Response('Messages array is required', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      console.error('No last message found');
      return new Response('At least one message is required', { status: 400 });
    }

    // Extrair texto da mensagem (pode ser string ou array de parts)
    let userText = '';
    if (typeof lastMessage.content === 'string') {
      userText = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      // Se for array de parts, concatenar texto
      userText = lastMessage.content
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join(' ');
    }

    console.log('User message:', userText);
    console.log('Selected model:', selectedChatModel);

    // Fazer requisição ao Ollama
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

    console.log('Ollama response status:', ollamaResponse.status);

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error('Ollama error:', errorText);
      throw new Error(`Ollama responded with status: ${ollamaResponse.status}`);
    }

    // Criar stream compatível com AI SDK
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting stream processing...');
          const reader = ollamaResponse.body?.getReader();
          if (!reader) {
            throw new Error('No reader available from Ollama response');
          }

          let fullResponse = '';
          let messageId = `msg-${Date.now()}`;
          
          // Enviar cabeçalho do stream AI SDK
          const header = `1:"${messageId}"\n`;
          controller.enqueue(encoder.encode(header));
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('Stream reading completed');
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.response) {
                  fullResponse += data.response;
                  
                  // Enviar chunk no formato AI SDK
                  const escapedText = data.response.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
                  const streamChunk = `0:"${escapedText}"\n`;
                  controller.enqueue(encoder.encode(streamChunk));
                }
                
                if (data.done) {
                  console.log('Ollama indicated completion');
                  break;
                }
              } catch (parseError) {
                console.log('Parse error (might be incomplete JSON):', parseError);
              }
            }
          }

          // Finalizar stream no formato AI SDK
          const finishData = `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`;
          controller.enqueue(encoder.encode(finishData));
          
          console.log('Stream finished. Full response length:', fullResponse.length);
          console.log('Full response preview:', fullResponse.substring(0, 100) + '...');
          controller.close();
          
        } catch (streamError) {
          console.error('Stream processing error:', streamError);
          const errorMessage = streamError instanceof Error ? streamError.message : 'Stream error';
          const errorChunk = `d:{"finishReason":"error","error":"${errorMessage}"}\n`;
          controller.enqueue(encoder.encode(errorChunk));
          controller.close();
        }
      },
    });

    console.log('Returning stream response');
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('=== CHAT API ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
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
    status: 'New Chat API is working',
    model: 'MasterKey:latest',
    endpoint: '/api/new-chat',
    timestamp: new Date().toISOString(),
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
