/*
  # Initial Schema for Multi-client Food System

  1. New Tables
    - `businesses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text) - Type of business (pizzaria, pastelaria, etc)
      - `logo_url` (text)
      - `delivery_fee` (numeric)
      - `whatsapp` (text)
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `image_url` (text)
      - `in_stock` (boolean)
      - `created_at` (timestamp)
    
    - `sizes`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `name` (text)
      - `max_flavors` (integer)
      - `price` (numeric)
      - `description` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create businesses table
CREATE TABLE businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  logo_url text,
  delivery_fee numeric NOT NULL DEFAULT 5.00,
  whatsapp text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  in_stock boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create sizes table (for businesses that need size options like pizzas)
CREATE TABLE sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) NOT NULL,
  name text NOT NULL,
  max_flavors integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access" ON businesses
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Public read access" ON products
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Public read access" ON sizes
  FOR SELECT TO public
  USING (true);