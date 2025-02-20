/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `business_id` (uuid, references businesses)
      - `customer_name` (text)
      - `customer_phone` (text)
      - `customer_address` (text)
      - `customer_complement` (text, nullable)
      - `payment_method` (text)
      - `change_for` (numeric, nullable)
      - `items` (jsonb)
      - `subtotal` (numeric)
      - `delivery_fee` (numeric)
      - `total` (numeric)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `orders` table
    - Add policies for:
      - Public can create orders
      - Business owners can read their own orders
      - Business owners can update their own orders
*/

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  customer_complement text,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'pix')),
  change_for numeric,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  delivery_fee numeric NOT NULL,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'delivering', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX orders_business_id_idx ON orders(business_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Business owners can read their orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'business_admin'
    )
  );

CREATE POLICY "Business owners can update their orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'business_admin'
    )
  );