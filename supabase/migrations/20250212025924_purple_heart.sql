/*
  # Create test order and delivery

  1. New Data
    - Create a test order
    - Create a delivery record for the order
    - Associate with an existing driver

  2. Changes
    - Insert test order data
    - Insert delivery record
    - Link order with delivery
*/

-- Insert test order
INSERT INTO orders (
  id,
  business_id,
  customer_name,
  customer_phone,
  customer_address,
  customer_complement,
  payment_method,
  items,
  subtotal,
  delivery_fee,
  total,
  status
) VALUES (
  'd5bd4186-0000-0000-0000-000000000000',
  (SELECT id FROM businesses LIMIT 1),
  'João Silva',
  '11999999999',
  'Rua Teste, 123',
  'Apto 42',
  'cash',
  '[{"quantity": 1, "products": [{"name": "Pizza Margherita", "price": 45.90}]}]',
  45.90,
  5.00,
  50.90,
  'preparing'
);

-- Create delivery record
INSERT INTO deliveries (
  order_id,
  driver_id,
  fee,
  status
) VALUES (
  'd5bd4186-0000-0000-0000-000000000000',
  (SELECT id FROM delivery_drivers WHERE active = true LIMIT 1),
  5.00,
  'assigned'
);