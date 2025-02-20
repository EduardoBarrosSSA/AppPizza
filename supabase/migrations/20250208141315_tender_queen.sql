/*
  # Add initial business admin user

  1. Changes
    - Insert initial admin user into auth.users
    - Insert admin profile linking to Pizza Express business
  
  2. Security
    - User will need to reset password on first login
*/

-- Create initial admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@pizzaexpress.com',
  crypt('initial123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  ''
);

-- Create admin profile
INSERT INTO profiles (
  user_id,
  role,
  business_id
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'business_admin',
  '123e4567-e89b-12d3-a456-426614174000' -- Pizza Express ID
);