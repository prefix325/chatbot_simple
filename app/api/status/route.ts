export async function GET() {
  try {
    // Testar conexão com Ollama
    const ollamaResponse = await fetch('http://localhost:11434/api/tags');
    const ollamaStatus = ollamaResponse.ok ? 'connected' : 'error';
    
    return Response.json({
      timestamp: new Date().toISOString(),
      nextjs: 'running',
      port: process.env.PORT || '3000',
      ollama: {
        status: ollamaStatus,
        url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      },
      environment: {
        node_env: process.env.NODE_ENV,
        ollama_base_url: process.env.OLLAMA_BASE_URL,
        ollama_model: process.env.OLLAMA_MODEL,
      }
    });
  } catch (error) {
    return Response.json({
      timestamp: new Date().toISOString(),
      nextjs: 'running',
      port: process.env.PORT || '3000',
      ollama: {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      environment: {
        node_env: process.env.NODE_ENV,
        ollama_base_url: process.env.OLLAMA_BASE_URL,
        ollama_model: process.env.OLLAMA_MODEL,
      }
    }, { status: 500 });
  }
}
