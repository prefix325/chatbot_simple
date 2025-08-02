import postgres from 'postgres';
import { config } from 'dotenv';

config({
  path: '.env.local',
});

const sql = postgres(process.env.POSTGRES_URL);

async function checkUser() {
  try {
    console.log('Checking for test user...');
    
    // Verificar usuário de teste específico
    const users = await sql`
      SELECT id, email FROM "User" WHERE email = 'elesuw@gmail.com' OR id = '83376fb5-1866-47ac-8f2c-98c741f2f40f'
    `;
    
    console.log('Found users:', users);
    
    if (users.length === 0) {
      console.log('Creating test user...');
      
      const newUser = await sql`
        INSERT INTO "User" (id, email, password) 
        VALUES ('83376fb5-1866-47ac-8f2c-98c741f2f40f', 'elesuw@gmail.com', 'test123') 
        RETURNING id, email
      `;
      
      console.log('Created user:', newUser);
    }
    
    // Verificar chats
    const chats = await sql`SELECT COUNT(*) as count FROM "Chat"`;
    console.log('Total chats:', chats[0].count);
    
    // Verificar mensagens
    const messages = await sql`SELECT COUNT(*) as count FROM "Message_v2"`;
    console.log('Total messages:', messages[0].count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkUser();
