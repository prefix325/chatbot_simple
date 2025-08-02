// Criar usuário de teste
const { randomUUID } = require('crypto');

const createTestUser = async () => {
  try {
    console.log('Creating test user...');
    
    const userData = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'test@example.com',
      password: 'testpassword'
    };

    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    console.log('Response status:', response.status);
    const result = await response.text();
    console.log('Response data:', result);

  } catch (error) {
    console.error('Error creating user:', error);
  }
};

createTestUser();
