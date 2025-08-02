import { createOllama } from 'ollama-ai-provider';
import { streamText } from 'ai';
import { createDataStreamResponse } from 'ai';

// Configurar o cliente Ollama
const ollamaClient = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return new Response('Mensagem é obrigatória', { status: 400 });
    }

    console.log('Simple chat test with message:', message);

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: ollamaClient('MasterKey:latest'),
          prompt: `Você é um assistente útil. Responda de forma amigável e em português: ${message}`,
          experimental_generateMessageId: () => `msg-${Date.now()}`,
        });

        result.consumeStream();
        result.mergeIntoDataStream(dataStream);
      },
      onError: () => {
        return 'Erro ao processar sua mensagem!';
      },
    });
  } catch (error) {
    console.error('Simple chat error:', error);
    return new Response('Erro interno do servidor', { status: 500 });
  }
}
