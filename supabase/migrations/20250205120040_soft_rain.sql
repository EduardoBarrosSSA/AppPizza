/*
  # Add admin roles and permissions

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text) - Role type (system_admin, business_admin)
      - `business_id` (uuid, optional) - For business admins
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  role text NOT NULL CHECK (role IN ('system_admin', 'business_admin')),
  business_id uuid REFERENCES businesses(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT business_admin_must_have_business 
    CHECK (role != 'business_admin' OR business_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Update business policies
CREATE POLICY "Business admins can update their business"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND business_id = businesses.id
      AND role = 'business_admin'
    )
  );

CREATE POLICY "System admins can manage businesses"
  ON businesses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- Update product policies
CREATE POLICY "Business admins can manage their products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND business_id = products.business_id
      AND role = 'business_admin'
    )
  );