import { NextRequest } from 'next/server';
import { streamText } from 'ai';

export const maxDuration = 60;

// Provedor personalizado para Ollama
const ollamaProvider = {
  languageModel: (modelName: string) => ({
    provider: 'ollama',
    modelId: modelName,
    generate: async function* (prompt: string) {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield { type: 'text-delta', textDelta: data.response };
            }
            if (data.done) return;
          } catch {
            // Ignore parse errors for incomplete JSON
          }
        }
      }
    },
  }),
};

export async function POST(request: NextRequest) {
  try {
    console.log('=== AI SDK COMPATIBLE CHAT ===');
    
    const body = await request.json();
    const { messages, selectedChatModel = 'MasterKey:latest' } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      return new Response('At least one message is required', { status: 400 });
    }

    // Extrair texto da mensagem
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

    console.log('Processing prompt:', prompt);

    // Usar streamText do AI SDK com nosso provedor customizado
    const result = await streamText({
      model: {
        provider: 'ollama',
        modelId: selectedChatModel,
        async doStream({ prompt: streamPrompt }: { prompt: any }) {
          console.log('doStream called with:', streamPrompt);
          
          const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: selectedChatModel,
              prompt: streamPrompt.messages?.[0]?.content || streamPrompt,
              stream: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          return {
            stream: (async function* () {
              if (!reader) return;

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                  try {
                    const data = JSON.parse(line);
                    if (data.response) {
                      yield { type: 'text-delta', textDelta: data.response };
                    }
                    if (data.done) {
                      yield { type: 'finish', finishReason: 'stop' };
                      return;
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
            })(),
          };
        },
      } as any,
      prompt,
    });

    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('AI SDK Chat error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
