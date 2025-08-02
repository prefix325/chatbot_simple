export async function POST(request: Request) {
  try {
    console.log('Ultra Simple Chat - Request received');
    
    const body = await request.json();
    console.log('Ultra Simple Chat - Body:', JSON.stringify(body, null, 2));

    const { messages } = body;
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.content || 'Olá';
    
    console.log('Ultra Simple Chat - User message:', userText);

    // Fazer requisição direta ao Ollama
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MasterKey:latest',
        prompt: userText,
        stream: false,
      }),
    });

    console.log('Ultra Simple Chat - Ollama response status:', ollamaResponse.status);

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama responded with status: ${ollamaResponse.status}`);
    }

    const ollamaData = await ollamaResponse.json();
    console.log('Ultra Simple Chat - Ollama data:', ollamaData);

    // Retornar resposta simples do Ollama
    return new Response(JSON.stringify({
      success: true,
      response: ollamaData.response,
      timestamp: new Date().toISOString(),
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Ultra Simple Chat - Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
    status: 'Ultra Simple Chat API is working',
    timestamp: new Date().toISOString(),
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
