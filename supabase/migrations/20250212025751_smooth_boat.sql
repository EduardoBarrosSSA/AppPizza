/*
  # Fix driver login and lookup

  1. Changes
    - Drop existing policies
    - Create new policies for delivery drivers
    - Create new policies for deliveries
    - Add function to get driver info with better error handling

  2. Security
    - Enable public read access for delivery drivers
    - Allow business admins to manage their drivers
    - Allow drivers to update their deliveries
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read delivery drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Business admins can manage their drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Public can read deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can update their deliveries" ON deliveries;

-- Create new policies for delivery_drivers
CREATE POLICY "Public can read delivery drivers"
  ON delivery_drivers
  FOR SELECT
  TO public
  USING (true);

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
  );

-- Create new policies for deliveries
CREATE POLICY "Public can read deliveries"
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

-- Create function to get driver info with better error handling
CREATE OR REPLACE FUNCTION get_driver_info(phone_number text)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  active boolean,
  business_id uuid,
  business_name text,
  business_slug text
) AS $$
BEGIN
  -- Validate phone number format
  IF NOT phone_number ~ '^[0-9]{10,11}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.phone,
    d.active,
    d.business_id,
    b.name as business_name,
    b.slug as business_slug
  FROM delivery_drivers d
  JOIN businesses b ON b.id = d.business_id
  WHERE d.phone = phone_number;

  -- Check if any rows were returned
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver not found';
  END IF;
END;
$$ LANGUAGE plpgsql;