/*
  # Update Delivery Drivers Schema

  1. Changes
    - Add business_id to delivery_drivers table
    - Update RLS policies
    - Add new indexes

  2. Security
    - Update policies for business admins and drivers
*/

-- Add business_id to delivery_drivers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_drivers' 
    AND column_name = 'business_id'
  ) THEN
    ALTER TABLE delivery_drivers 
    ADD COLUMN business_id uuid REFERENCES businesses(id) NOT NULL;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Drivers can read own profile" ON delivery_drivers;
  DROP POLICY IF EXISTS "Business admins can manage their drivers" ON delivery_drivers;
END $$;

-- Create new policies
CREATE POLICY "Business admins can manage their drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'business_admin'
    )
  );

CREATE POLICY "Drivers can read own profile"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (
    phone = auth.uid()::text
  );

-- Create new indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'delivery_drivers' 
    AND indexname = 'delivery_drivers_business_id_idx'
  ) THEN
    CREATE INDEX delivery_drivers_business_id_idx ON delivery_drivers(business_id);
  END IF;
END $$;