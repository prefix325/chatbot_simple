export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return new Response('Mensagem é obrigatória', { status: 400 });
    }

    console.log('Fixed chat with message:', message);

    // Usar fetch direto para o Ollama com streaming
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MasterKey:latest',
        prompt: `Você é um assistente útil. Responda de forma amigável e em português: ${message}`,
        stream: true, // Habilitar streaming
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
    }

    // Retornar stream diretamente
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Fixed chat error:', error);
    return new Response('Erro interno do servidor', { status: 500 });
  }
}
