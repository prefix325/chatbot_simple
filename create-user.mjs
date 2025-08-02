// Script para criar usuário com credenciais específicas
import { createUser, getUser } from './lib/db/queries.js';

const createTestUser = async () => {
  try {
    const email = 'elesuw@gmail.com';
    const password = 'Sequoi@133233';
    
    console.log('Verificando se usuário já existe...');
    
    // Verificar se usuário já existe
    const existingUsers = await getUser(email);
    
    if (existingUsers.length > 0) {
      console.log('✅ Usuário já existe:', existingUsers[0]);
      console.log('ID do usuário:', existingUsers[0].id);
      return existingUsers[0];
    }
    
    console.log('Criando novo usuário...');
    const result = await createUser(email, password);
    console.log('✅ Usuário criado com sucesso:', result);
    
    // Verificar o usuário criado
    const newUser = await getUser(email);
    console.log('✅ Usuário verificado:', newUser[0]);
    console.log('ID do usuário:', newUser[0].id);
    
    return newUser[0];
    
  } catch (error) {
    console.error('❌ Erro ao criar/verificar usuário:', error);
  }
};

createTestUser();
