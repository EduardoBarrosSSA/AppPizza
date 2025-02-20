/*
  # Create ingredients table

  1. New Tables
    - `ingredients`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `name` (text)
      - `price` (numeric)
      - `optional` (boolean)
      - `is_default` (boolean) - Renamed from 'default' to avoid SQL keyword
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `ingredients` table
    - Add policies for public read access
    - Add policies for business admins to manage their ingredients
*/

-- Create ingredients table
CREATE TABLE ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  optional boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX ingredients_business_id_idx ON ingredients(business_id);

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can read ingredients"
  ON ingredients
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Business owners can manage their ingredients"
  ON ingredients
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'business_admin'
    )
  );