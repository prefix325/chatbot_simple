import { generateUUID } from './lib/utils';

const API_URL = 'http://localhost:3000';

async function testDuplicateSave() {
  try {
    const chatId = generateUUID(); // Usar apenas UUID válido
    
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
    
    console.log('=== PRIMEIRO SALVAMENTO ===');
    console.log('Test data:', {
      chatId: testData.chatId,
      messageCount: testData.messages.length,
      messageIds: testData.messages.map(m => m.id)
    });
    
    const response1 = await fetch(`${API_URL}/api/save-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const responseData1 = await response1.json();
    console.log('Primeiro salvamento:', responseData1);
    
    console.log('\n=== SEGUNDO SALVAMENTO (MESMO DADOS) ===');
    
    const response2 = await fetch(`${API_URL}/api/save-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const responseData2 = await response2.json();
    console.log('Segundo salvamento:', responseData2);
    
    console.log('\n=== TERCEIRO SALVAMENTO (COM NOVA MENSAGEM) ===');
    
    // Adicionar uma nova mensagem
    testData.messages.push({
      id: generateUUID(),
      role: 'user',
      content: 'And another message here',
      parts: [{ type: 'text', text: 'And another message here' }],
      attachments: [],
      createdAt: new Date().toISOString()
    });
    
    const response3 = await fetch(`${API_URL}/api/save-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const responseData3 = await response3.json();
    console.log('Terceiro salvamento com nova mensagem:', responseData3);
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Aguardar o servidor estar rodando
setTimeout(() => {
  testDuplicateSave();
}, 2000);
