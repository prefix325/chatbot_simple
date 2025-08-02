// Criar usuário via endpoint API
const createUser = async () => {
  try {
    console.log('Criando usuário elesuw@gmail.com...');
    
    const response = await fetch('http://localhost:3000/api/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'elesuw@gmail.com',
        password: 'Sequoi@133233'
      }),
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);

    if (response.ok) {
      console.log('✅ Usuário criado/verificado com sucesso!');
      console.log('ID do usuário:', result.user.id);
    } else {
      console.log('❌ Falha ao criar usuário:', result);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
};

createUser();
