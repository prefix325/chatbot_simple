import { saveChat, saveMessages } from './lib/db/queries';
import { generateUUID } from './lib/utils';

async function testSaveChat() {
  try {
    const chatId = generateUUID();
    const userId = '83376fb5-1866-47ac-8f2c-98c741f2f40f';
    
    console.log('Testing chat save with ID:', chatId);
    
    // Salvar chat
    const chatResult = await saveChat({
      id: chatId,
      userId: userId,
      title: 'Test Chat'
    });
    
    console.log('Chat saved successfully:', chatResult);
    
    // Criar mensagens de teste com estrutura correta
    const testMessages = [
      {
        id: generateUUID(),
        chatId: chatId,
        role: 'user',
        parts: [{ type: 'text', text: 'Hello, how are you?' }],
        attachments: [],
        createdAt: new Date()
      },
      {
        id: generateUUID(),
        chatId: chatId,
        role: 'assistant',
        parts: [{ type: 'text', text: 'I am fine, thank you! How can I help you?' }],
        attachments: [],
        createdAt: new Date()
      }
    ];
    
    console.log('Testing messages save...');
    console.log('Test messages structure:', testMessages.map(m => ({
      id: m.id,
      chatId: m.chatId,
      role: m.role,
      partsLength: m.parts.length,
      attachmentsLength: m.attachments.length
    })));
    
    // Salvar mensagens
    const messagesResult = await saveMessages({
      messages: testMessages
    });
    
    console.log('Messages saved successfully:', messagesResult);
    
  } catch (error) {
    console.error('Error in test:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : error,
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
  }
}

testSaveChat();
