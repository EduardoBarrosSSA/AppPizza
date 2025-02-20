/*
  # Update delivery drivers policies

  1. Changes
    - Drop existing policies
    - Create new comprehensive policies for delivery drivers
    - Add business admin policies
  
  2. Security
    - Enable RLS
    - Add policies for business admins and drivers
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Business admins can manage their drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read own profile" ON delivery_drivers;

-- Create new policies for delivery_drivers
CREATE POLICY "Business admins can manage their drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND business_id = delivery_drivers.business_id
      AND role = 'business_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND business_id = delivery_drivers.business_id
      AND role = 'business_admin'
    )
  );

CREATE POLICY "Drivers can read own profile"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (
    phone = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND business_id = delivery_drivers.business_id
      AND role = 'business_admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS delivery_drivers_phone_idx ON delivery_drivers(phone);
CREATE INDEX IF NOT EXISTS delivery_drivers_business_id_idx ON delivery_drivers(business_id);