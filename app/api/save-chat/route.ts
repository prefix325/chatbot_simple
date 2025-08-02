import { NextRequest } from 'next/server';
import { saveChat, saveMessages } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';
import { generateTitleFromUserMessage } from '@/app/(chat)/actions';
import { ChatLogger, logDatabaseOperation } from '@/lib/logger';
import type { DBMessage } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  const logger = new ChatLogger('save-chat-api');
  
  try {
    logger.info('Save chat API called');
    
    const session = await auth();
    if (!session || !session.user) {
      logger.error('Unauthorized: No session found');
      // Para testes, usar o usuário elesuw@gmail.com
      logger.info('Using test user for development');
    }

    const body = await request.json();
    const { chatId, messages } = body;

    if (!chatId || !messages || !Array.isArray(messages)) {
      logger.error('Invalid request body', { chatId, messagesLength: messages?.length });
      return new Response('Invalid request body', { status: 400 });
    }

    // Usar o usuário logado ou o usuário de teste
    const userId = session?.user?.id || '83376fb5-1866-47ac-8f2c-98c741f2f40f';

    logger.info('Processing save chat request', {
      chatId,
      userId: userId,
      messagesCount: messages.length
    });

    // Verificar se o chat já existe
    const existingChat = await import('@/lib/db/queries').then(m => m.getChatById({ id: chatId }));
    
    let chatTitle = 'New Chat';
    
    // Se é um novo chat e há mensagens do usuário, gerar título
    if (!existingChat && messages.length > 0) {
      const firstUserMessage = messages.find((msg: any) => msg.role === 'user');
      if (firstUserMessage) {
        try {
          chatTitle = await generateTitleFromUserMessage({
            message: firstUserMessage
          });
          logger.info('Generated chat title', { title: chatTitle });
        } catch (titleError) {
          logger.warning('Failed to generate title, using default', { error: titleError });
          chatTitle = 'New Chat';
        }
      }
    }

    // Salvar chat se não existir
    if (!existingChat) {
      logger.info('Saving new chat', { chatId, title: chatTitle });
      await saveChat({
        id: chatId,
        userId: userId,
        title: chatTitle
      });
    }

    // Converter mensagens para formato do banco de dados
    const dbMessages: DBMessage[] = messages.map((msg: any) => ({
      id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      chatId: chatId,
      role: msg.role,
      parts: msg.parts || [{ type: 'text', text: msg.content || '' }],
      createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      attachments: msg.attachments || msg.experimental_attachments || []
    }));

    // Salvar mensagens
    logger.info('Saving messages', { count: dbMessages.length });
    await saveMessages({ messages: dbMessages });

    logger.info('Chat and messages saved successfully');
    
    return new Response(JSON.stringify({
      success: true,
      chatId,
      messagesCount: dbMessages.length,
      title: chatTitle
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Failed to save chat', { error: error instanceof Error ? error.message : error });
    console.error('Save chat error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to save chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
