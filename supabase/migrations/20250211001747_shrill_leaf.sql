/*
  # Atualizar senha do administrador

  1. Alterações
    - Atualiza a senha do usuário administrador para uma senha mais segura
*/

UPDATE auth.users
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@pizzaexpress.com';