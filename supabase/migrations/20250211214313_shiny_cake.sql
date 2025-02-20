-- Drop existing policies
DROP POLICY IF EXISTS "Allow public registration" ON businesses;
DROP POLICY IF EXISTS "Business admins can update their business" ON businesses;
DROP POLICY IF EXISTS "System admins can manage businesses" ON businesses;
DROP POLICY IF EXISTS "Public read access" ON businesses;

-- Create new policies for businesses
CREATE POLICY "Public read access"
  ON businesses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public registration"
  ON businesses
  FOR INSERT
  TO public
  WITH CHECK (true);

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

-- Create policies for profiles
CREATE POLICY "Allow public profile creation"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Update business_subscriptions table to be a nested JSON in businesses
ALTER TABLE businesses
ADD COLUMN subscription jsonb;

-- Create a function to validate subscription data
CREATE OR REPLACE FUNCTION validate_subscription_data()
RETURNS trigger AS $$
BEGIN
  IF NEW.subscription IS NOT NULL THEN
    IF NOT (
      NEW.subscription ? 'plan_id' AND
      NEW.subscription ? 'status' AND
      NEW.subscription ? 'expires_at'
    ) THEN
      RAISE EXCEPTION 'Invalid subscription data structure';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate subscription data
CREATE TRIGGER validate_subscription_data_trigger
BEFORE INSERT OR UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION validate_subscription_data();