import { createOllama } from 'ollama-ai-provider';
import { generateText } from 'ai';

// Configurar o cliente Ollama
const ollamaClient = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

export async function GET() {
  try {
    console.log('Testing Ollama connection with direct fetch...');
    
    // Testar com fetch direto primeiro
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MasterKey:latest',
        prompt: 'Responda apenas com "OK" se você está funcionando.',
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    return Response.json({
      status: 'success',
      message: 'Ollama conectado com sucesso via fetch direto!',
      response: result.response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ollama test error:', error);
    return Response.json({
      status: 'error',
      message: 'Erro ao conectar com Ollama',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return Response.json({
        status: 'error',
        message: 'Mensagem é obrigatória',
      }, { status: 400 });
    }

    console.log('Testing Ollama with message via direct fetch:', message);
    
    // Usar fetch direto também para POST
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MasterKey:latest',
        prompt: message,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    return Response.json({
      status: 'success',
      message: 'Resposta gerada com sucesso via fetch direto!',
      response: result.response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ollama POST test error:', error);
    return Response.json({
      status: 'error',
      message: 'Erro ao gerar resposta',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
