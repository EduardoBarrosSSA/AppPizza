/*
  # Add system configuration tables

  1. New Tables
    - `business_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique)
      - `icon` (text)
      - `active` (boolean)
      - `created_at` (timestamp)
    
    - `system_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add `category_id` to businesses table
    - Update business type to use categories

  3. Security
    - Enable RLS
    - Add policies for system admins
*/

-- Create business categories table
CREATE TABLE business_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create system settings table
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add category_id to businesses
ALTER TABLE businesses
ADD COLUMN category_id uuid REFERENCES business_categories(id);

-- Enable RLS
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policies for business_categories
CREATE POLICY "Public can read active categories"
  ON business_categories
  FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "System admins can manage categories"
  ON business_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- Policies for system_settings
CREATE POLICY "System admins can manage settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- Insert default categories
INSERT INTO business_categories (name, slug, icon, active) VALUES
  ('Pizzaria', 'pizzaria', 'pizza', true),
  ('Pastelaria', 'pastelaria', 'cookie', true),
  ('Creperia', 'crepe', 'utensils', true),
  ('Acarajé', 'acaraje', 'sandwich', true);

-- Insert initial system settings
INSERT INTO system_settings (key, value) VALUES
  ('delivery_settings', '{"min_order_value": 15, "max_delivery_radius": 5, "default_delivery_fee": 5}'::jsonb),
  ('business_settings', '{"require_address": true, "require_phone": true, "max_categories": 3}'::jsonb);