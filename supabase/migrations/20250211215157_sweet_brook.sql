-- Drop existing policies
DROP POLICY IF EXISTS "Allow public registration" ON businesses;
DROP POLICY IF EXISTS "Business admins can update their business" ON businesses;
DROP POLICY IF EXISTS "System admins can manage businesses" ON businesses;
DROP POLICY IF EXISTS "Public read access" ON businesses;
DROP POLICY IF EXISTS "Allow public profile creation" ON profiles;

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

-- Create policy for authenticated users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS businesses_subscription_idx ON businesses USING gin(subscription);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_business_id_idx ON profiles(business_id);