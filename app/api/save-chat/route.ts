import { NextRequest } from 'next/server';
import { saveChat, saveMessages, upsertMessages } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';
import { generateTitleFromUserMessage } from '@/app/(chat)/actions';
import { ChatLogger, logDatabaseOperation } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';
import type { DBMessage } from '@/lib/db/schema';

// Função para validar se uma string é um UUID válido
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Função para gerar um UUID válido
function generateValidUUID(): string {
  return generateUUID();
}

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
    const dbMessages: DBMessage[] = messages
      .filter((msg: any) => msg && msg.role && (msg.content || (msg.parts && msg.parts.length > 0)))
      .map((msg: any) => {
        // Garantir que o ID da mensagem seja um UUID válido
        let messageId = msg.id;
        if (!messageId || !isValidUUID(messageId)) {
          messageId = generateValidUUID();
        }

        return {
          id: messageId,
          chatId: chatId,
          role: msg.role,
          parts: msg.parts || [{ type: 'text', text: msg.content || '' }],
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          attachments: msg.attachments || msg.experimental_attachments || []
        };
      });

    if (dbMessages.length === 0) {
      logger.warning('No valid messages to save after filtering');
      return new Response(JSON.stringify({
        success: true,
        chatId,
        messagesCount: 0,
        title: chatTitle,
        message: 'No messages to save'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Usar upsert para evitar duplicados - salva apenas mensagens que não existem
    logger.info('Upserting messages', { 
      totalMessages: dbMessages.length,
      messageIds: dbMessages.map(m => m.id)
    });
    await upsertMessages({ messages: dbMessages });

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
