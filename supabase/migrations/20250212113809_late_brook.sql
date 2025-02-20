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
      WHERE phone = SPLIT_PART(auth.email(), '@', 1)
      AND active = true
    )
  );

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

-- Create function to validate driver credentials
CREATE OR REPLACE FUNCTION validate_driver_credentials(
  p_phone text,
  p_password text
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users u
    JOIN delivery_drivers d ON d.phone = SPLIT_PART(u.email, '@', 1)
    WHERE SPLIT_PART(u.email, '@', 1) = p_phone
    AND u.encrypted_password = crypt(p_password, u.encrypted_password)
    AND d.active = true
  );
END;
$$ LANGUAGE plpgsql;