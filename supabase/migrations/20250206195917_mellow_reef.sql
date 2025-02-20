/*
  # Insert initial business data

  1. Data Insertion
    - Add initial businesses with proper UUIDs
    - Set up basic business information including:
      - Name
      - Type
      - Logo URL
      - Delivery fee
      - WhatsApp contact

  2. Notes
    - Using fixed UUIDs for predictable references
    - All businesses start with standard delivery fee
*/

INSERT INTO businesses (id, name, type, logo_url, delivery_fee, whatsapp)
VALUES
  (
    '123e4567-e89b-12d3-a456-426614174000',
    'Pizza Express',
    'pizzaria',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591',
    5.00,
    '5511999999999'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174001',
    'Pastel da Feira',
    'pastelaria',
    'https://images.unsplash.com/photo-1628294895950-9805252327bc',
    5.00,
    '5511999999999'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174002',
    'Crepe Delícia',
    'crepe',
    'https://images.unsplash.com/photo-1519676867240-f03562e64548',
    5.00,
    '5511999999999'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174003',
    'Acarajé da Bahia',
    'acaraje',
    'https://images.unsplash.com/photo-1574484284002-952d92456975',
    5.00,
    '5511999999999'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  logo_url = EXCLUDED.logo_url,
  delivery_fee = EXCLUDED.delivery_fee,
  whatsapp = EXCLUDED.whatsapp;