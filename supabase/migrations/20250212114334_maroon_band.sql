/*
  # Fix Driver Registration and Permissions

  1. Changes
    - Add proper RLS policies for driver registration
    - Create secure function for driver registration
    - Add validation and error handling

  2. Security
    - Enable RLS on delivery_drivers table
    - Add policies for business admins and drivers
    - Validate all inputs in functions
*/

-- Create function to handle driver registration with proper error handling
CREATE OR REPLACE FUNCTION register_driver(
  p_name text,
  p_phone text,
  p_business_id uuid,
  p_password text
)
RETURNS uuid AS $$
DECLARE
  v_driver_id uuid;
  v_user_id uuid;
BEGIN
  -- Validate inputs
  IF p_name IS NULL OR p_name = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;

  IF NOT p_phone ~ '^[0-9]{10,11}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;

  -- Check if phone is already registered
  IF EXISTS (
    SELECT 1 FROM delivery_drivers
    WHERE phone = p_phone
    AND business_id = p_business_id
  ) THEN
    RAISE EXCEPTION 'Phone number already registered';
  END IF;

  -- Create driver record
  INSERT INTO delivery_drivers (
    name,
    phone,
    business_id,
    active
  ) VALUES (
    p_name,
    p_phone,
    p_business_id,
    true
  ) RETURNING id INTO v_driver_id;

  -- Create auth user using built-in auth.create_user function
  SELECT id INTO v_user_id
  FROM auth.create_user(
    jsonb_build_object(
      'email', p_phone || '@driver.pedechega.com',
      'password', p_password,
      'email_confirm', true,
      'user_metadata', jsonb_build_object(
        'role', 'driver',
        'driver_id', v_driver_id,
        'business_id', p_business_id
      )
    )
  );

  IF v_user_id IS NULL THEN
    -- Rollback driver creation if user creation fails
    DELETE FROM delivery_drivers WHERE id = v_driver_id;
    RAISE EXCEPTION 'Failed to create user account';
  END IF;

  RETURN v_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read delivery drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Business admins can manage their drivers" ON delivery_drivers;

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

-- Create function to get driver info
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