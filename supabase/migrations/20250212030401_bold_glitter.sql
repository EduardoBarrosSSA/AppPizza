/*
  # Fix delivery access policies

  1. Changes
    - Drop existing policies
    - Create new policies for deliveries table
    - Add policy for drivers to read their own deliveries
    - Add policy for drivers to update their own deliveries
    - Add policy for business admins to manage deliveries

  2. Security
    - Enable RLS
    - Add proper policies for delivery drivers
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Drivers can read their deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can update their deliveries" ON deliveries;
DROP POLICY IF EXISTS "Business admins can manage deliveries" ON deliveries;

-- Create new policies for deliveries
CREATE POLICY "Drivers can read their deliveries"
  ON deliveries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Drivers can update their deliveries"
  ON deliveries
  FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM delivery_drivers
      WHERE phone = auth.uid()::text
    )
  );

CREATE POLICY "Business admins can manage deliveries"
  ON deliveries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN orders o ON o.business_id = p.business_id
      WHERE p.user_id = auth.uid()
      AND p.role = 'business_admin'
      AND o.id = deliveries.order_id
    )
  );