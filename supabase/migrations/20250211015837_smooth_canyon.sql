-- Criar usuário para Pastel da Feira
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
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'admin@pastelaria.com',
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

-- Criar perfil para Pastel da Feira
INSERT INTO profiles (
  user_id,
  role,
  business_id
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'business_admin',
  '123e4567-e89b-12d3-a456-426614174001'
);

-- Criar usuário para Crepe Delícia
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
  '33333333-3333-3333-3333-333333333333',
  'authenticated',
  'authenticated',
  'admin@creperia.com',
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

-- Criar perfil para Crepe Delícia
INSERT INTO profiles (
  user_id,
  role,
  business_id
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'business_admin',
  '123e4567-e89b-12d3-a456-426614174002'
);

-- Criar usuário para Acarajé da Bahia
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
  '44444444-4444-4444-4444-444444444444',
  'authenticated',
  'authenticated',
  'admin@acaraje.com',
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

-- Criar perfil para Acarajé da Bahia
INSERT INTO profiles (
  user_id,
  role,
  business_id
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'business_admin',
  '123e4567-e89b-12d3-a456-426614174003'
);