/*
  # Correção do usuário administrador

  1. Alterações
    - Remove o usuário administrador existente (se houver)
    - Cria um novo usuário administrador com as credenciais corretas
    - Garante que o perfil do administrador está corretamente vinculado
*/

-- Remover usuário existente e seu perfil
DELETE FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM auth.users WHERE email = 'admin@pizzaexpress.com';

-- Criar novo usuário administrador
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@pizzaexpress.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Criar perfil do administrador
INSERT INTO profiles (
  user_id,
  role,
  business_id
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'business_admin',
  '123e4567-e89b-12d3-a456-426614174000'
) ON CONFLICT (id) DO NOTHING;