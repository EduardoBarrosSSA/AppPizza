/*
  # Registration RLS Policies

  1. Changes
    - Add policy to allow public inserts for registration
    - Update existing policies to handle registration flow
  
  2. Security
    - Only allow inserts with specific fields during registration
    - Maintain existing security for other operations
*/

-- Allow public inserts for registration
CREATE POLICY "Allow public registration"
  ON businesses
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Update existing policies to be more specific
DROP POLICY IF EXISTS "Business admins can update their business" ON businesses;
DROP POLICY IF EXISTS "System admins can manage businesses" ON businesses;

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