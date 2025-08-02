import { streamText } from 'ai';
import { ollama } from 'ollama-ai-provider';
import { NextRequest } from 'next/server';
import { ChatLogger } from '@/lib/logger';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let logger: ChatLogger | null = null;
  
  try {
    console.log('=== CHAT API WITH OLLAMA PROVIDER ===');
    console.log('Request received at:', new Date().toISOString());
    
    const body = await request.json();
    console.log('Request body keys:', Object.keys(body));
    
    const { 
      id, 
      messages, 
      selectedChatModel = 'MasterKey:latest' 
    } = body;

    // Inicializar logger para este chat específico
    logger = new ChatLogger(id || 'unknown');
    logger.info('Chat request received', { 
      chatId: id, 
      model: selectedChatModel, 
      messageCount: messages?.length 
    });

    if (!messages || !Array.isArray(messages)) {
      logger.error('No messages array found in request');
      console.error('No messages array found');
      return new Response('Messages array is required', { status: 400 });
    }

    logger.info('Starting chat processing', {
      chatId: id,
      selectedModel: selectedChatModel,
      messagesCount: messages.length
    });

    // Primeiro, verificar se o Ollama está acessível
    try {
      logger.debug('Starting Ollama health check');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const ollamaHealth = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!ollamaHealth.ok) {
        throw new Error(`Ollama health check failed: ${ollamaHealth.status}`);
      }
      
      logger.info('Ollama health check passed');
      console.log('Ollama health check passed');
    } catch (healthError) {
      logger.error('Ollama health check failed', { error: healthError });
      console.error('Ollama health check failed:', healthError);
      return new Response(JSON.stringify({
        error: 'Ollama service is not available',
        details: healthError instanceof Error ? healthError.message : 'Unknown health check error',
        timestamp: new Date().toISOString(),
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Converter mensagens para formato esperado pelo AI SDK
    logger.debug('Converting messages to AI SDK format');
    const formattedMessages = messages.map((msg: any, index: number) => {
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

      logger?.debug(`Message ${index}`, { role: msg.role, contentLength: content.length });

      return {
        role: msg.role,
        content: content || 'Empty message',
      };
    });

    logger.info('Messages formatted successfully', {
      originalCount: messages.length,
      formattedCount: formattedMessages.length,
      lastMessage: formattedMessages[formattedMessages.length - 1]
    });

    console.log('Formatted messages count:', formattedMessages.length);
    console.log('Last message:', formattedMessages[formattedMessages.length - 1]);

    // Validar se há pelo menos uma mensagem válida
    if (formattedMessages.length === 0) {
      logger.error('No valid messages after formatting');
      console.error('No valid messages after formatting');
      return new Response(JSON.stringify({
        error: 'No valid messages found',
        timestamp: new Date().toISOString(),
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Usar o provedor Ollama oficial com AI SDK
    logger.info('Starting streamText with Ollama provider');
    
    try {
      // Mapear o modelo para usar sempre MasterKey:latest
      const actualModel = selectedChatModel === 'chat-model' ? 'MasterKey:latest' : selectedChatModel;
      logger.info('Using Ollama model', { requestedModel: selectedChatModel, actualModel });
      
      const result = await streamText({
        model: ollama(actualModel),
        messages: formattedMessages,
        experimental_generateMessageId: () => `msg-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      });

      logger.info('StreamText created successfully, returning data stream response');
      console.log('Streaming response from Ollama AI Provider...');
      return result.toDataStreamResponse();
      
    } catch (streamError) {
      logger.error('Error in streamText creation', { 
        error: streamError instanceof Error ? streamError.message : streamError,
        stack: streamError instanceof Error ? streamError.stack : undefined 
      });
      console.error('StreamText error:', streamError);
      
      return new Response(JSON.stringify({
        error: 'Failed to create stream',
        details: streamError instanceof Error ? streamError.message : 'Unknown stream error',
        timestamp: new Date().toISOString(),
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Log do erro
    if (logger) {
      logger.error('Chat API error occurred', { 
        error: errorMessage, 
        stack: error instanceof Error ? error.stack : undefined 
      });
    }
    
    console.error('=== CHAT API ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Determinar o tipo de erro e retornar uma resposta apropriada
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Categorizar diferentes tipos de erro
      if (error.message.includes('fetch') || error.message.includes('network')) {
        statusCode = 503;
      } else if (error.message.includes('timeout')) {
        statusCode = 504;
      } else if (error.message.includes('model')) {
        statusCode = 503;
      }
    }
    
    return new Response(JSON.stringify({
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
