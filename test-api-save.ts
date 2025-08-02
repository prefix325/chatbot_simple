import { generateUUID } from './lib/utils';

const API_URL = 'http://localhost:3000';

async function testSaveChatAPI() {
  try {
    const chatId = generateUUID();
    
    console.log('Testing save-chat API with chatId:', chatId);
    
    const testData = {
      chatId: chatId,
      messages: [
        {
          id: generateUUID(),
          role: 'user',
          content: 'Hello, this is a test message',
          parts: [{ type: 'text', text: 'Hello, this is a test message' }],
          attachments: [],
          createdAt: new Date().toISOString()
        },
        {
          id: generateUUID(),
          role: 'assistant',
          content: 'Hello! I am here to help you.',
          parts: [{ type: 'text', text: 'Hello! I am here to help you.' }],
          attachments: [],
          createdAt: new Date().toISOString()
        }
      ]
    };
    
    console.log('Test data:', {
      chatId: testData.chatId,
      messageCount: testData.messages.length,
      messageIds: testData.messages.map(m => m.id)
    });
    
    const response = await fetch(`${API_URL}/api/save-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      console.log('✅ API Response Success:', responseData);
    } else {
      console.error('❌ API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Aguardar o servidor estar rodando
setTimeout(() => {
  testSaveChatAPI();
}, 3000);
