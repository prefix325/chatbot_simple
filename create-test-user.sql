-- Script SQL para criar usuário de teste
INSERT INTO "User" (id, email, password) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'testpassword')
ON CONFLICT (id) DO NOTHING;
