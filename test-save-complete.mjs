import { saveChat, saveMessages } from './lib/db/queries.js';
import { generateUUID } from './lib/utils.js';

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
    console.log('Test messages:', testMessages);
    
    // Salvar mensagens
    const messagesResult = await saveMessages({
      messages: testMessages
    });
    
    console.log('Messages saved successfully:', messagesResult);
    
  } catch (error) {
    console.error('Error in test:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
  }
}

testSaveChat();
