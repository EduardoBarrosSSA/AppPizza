-- Drop existing policies
DROP POLICY IF EXISTS "Business admins can manage their drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read own profile" ON delivery_drivers;

-- Create new policies for delivery_drivers with proper RLS
CREATE POLICY "Public can insert delivery drivers"
  ON delivery_drivers
  FOR INSERT
  TO public
  WITH CHECK (true);

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

-- Create function to validate driver data
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for data validation
DROP TRIGGER IF EXISTS validate_driver_data_trigger ON delivery_drivers;
CREATE TRIGGER validate_driver_data_trigger
  BEFORE INSERT OR UPDATE ON delivery_drivers
  FOR EACH ROW
  EXECUTE FUNCTION validate_driver_data();