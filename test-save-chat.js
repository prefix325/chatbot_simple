// Teste direto do endpoint save-chat
const { randomUUID } = require('crypto');

const testSaveChat = async () => {
  try {
    console.log('Testing save-chat endpoint...');
    
    const testChatId = randomUUID();
    const testData = {
      chatId: testChatId,
      messages: [
        {
          id: randomUUID(),
          role: 'user',
          content: 'Teste de salvamento',
          createdAt: new Date().toISOString()
        },
        {
          id: randomUUID(),
          role: 'assistant',
          content: 'Resposta de teste',
          createdAt: new Date().toISOString()
        }
      ]
    };

    const response = await fetch('http://localhost:3000/api/save-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);

    if (response.ok) {
      console.log('✅ Save chat test passed!');
    } else {
      console.log('❌ Save chat test failed:', result);
    }

  } catch (error) {
    console.error('❌ Save chat test error:', error);
  }
};

testSaveChat();
