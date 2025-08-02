import { NextRequest } from 'next/server';
import { createUser, getUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response('Email and password are required', { status: 400 });
    }

    console.log('Verificando se usuário já existe...');
    
    // Verificar se usuário já existe
    const existingUsers = await getUser(email);
    
    if (existingUsers.length > 0) {
      console.log('✅ Usuário já existe:', existingUsers[0]);
      return new Response(JSON.stringify({
        success: true,
        message: 'User already exists',
        user: {
          id: existingUsers[0].id,
          email: existingUsers[0].email
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Criando novo usuário...');
    await createUser(email, password);
    
    // Verificar o usuário criado
    const newUser = await getUser(email);
    console.log('✅ Usuário criado com sucesso:', newUser[0]);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser[0].id,
        email: newUser[0].email
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
