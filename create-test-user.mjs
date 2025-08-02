// Script para criar usuário de teste usando as funções do projeto
import { createUser } from './lib/db/queries.js';

const main = async () => {
  try {
    console.log('Creating test user...');
    
    const userId = await createUser('test@example.com', 'testpassword');
    console.log('User created with ID:', userId);
    
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

main();
