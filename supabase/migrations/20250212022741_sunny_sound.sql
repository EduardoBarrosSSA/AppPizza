-- Drop existing policies
DROP POLICY IF EXISTS "Business admins can manage their drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read own profile" ON delivery_drivers;

-- Create new policies for delivery_drivers with proper RLS
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

-- Update function to validate driver data
CREATE OR REPLACE FUNCTION validate_driver_data()
RETURNS trigger AS $$
BEGIN
  -- Validate phone number format
  IF NOT NEW.phone ~ '^[0-9]{10,11}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  -- Ensure business_id is set
  IF NEW.business_id IS NULL THEN
    RAISE EXCEPTION 'business_id is required';
  END IF;

  -- Ensure name is not empty
  IF NEW.name IS NULL OR NEW.name = '' THEN
    RAISE EXCEPTION 'name is required';
  END IF;

  -- Ensure phone is unique per business
  IF EXISTS (
    SELECT 1 FROM delivery_drivers
    WHERE phone = NEW.phone
    AND business_id = NEW.business_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Phone number already registered for this business';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS delivery_drivers_phone_business_idx 
ON delivery_drivers(phone, business_id);