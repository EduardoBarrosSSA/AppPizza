/*
  # Fix Driver Registration and Permissions

  1. Changes
    - Drop existing get_driver_info function before recreating it
    - Update RLS policies for better security
    - Add proper error handling for driver registration

  2. Security
    - Enable RLS on delivery_drivers table
    - Add policies for business admins and drivers
    - Validate all inputs in functions
*/

-- Drop existing function first
DROP FUNCTION IF EXISTS get_driver_info(text);
DROP FUNCTION IF EXISTS register_driver(text, text, uuid, text);

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

-- Create function to handle driver registration
CREATE OR REPLACE FUNCTION register_driver(
  p_name text,
  p_phone text,
  p_business_id uuid,
  p_password text
)
RETURNS uuid AS $$
DECLARE
  v_driver_id uuid;
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

  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_phone || '@driver.pedechega.com',
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'role', 'driver',
      'driver_id', v_driver_id,
      'business_id', p_business_id
    ),
    now(),
    now()
  );

  RETURN v_driver_id;
END;
$$ LANGUAGE plpgsql;

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