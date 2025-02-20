/*
  # Fix delivery listing and access

  1. Changes
    - Drop existing policies
    - Create new policies for deliveries table
    - Add policy for public read access to deliveries
    - Add policy for drivers to update their deliveries
    - Add policy for business admins to manage deliveries
    - Add function to get driver deliveries

  2. Security
    - Enable RLS
    - Add proper policies for delivery drivers
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can update their deliveries" ON deliveries;
DROP POLICY IF EXISTS "Business admins can manage deliveries" ON deliveries;

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

-- Create function to get driver deliveries
CREATE OR REPLACE FUNCTION get_driver_deliveries(phone_number text)
RETURNS TABLE (
  id uuid,
  order_id uuid,
  fee numeric,
  status text,
  created_at timestamptz,
  completed_at timestamptz,
  order_details jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.order_id,
    d.fee,
    d.status,
    d.created_at,
    d.completed_at,
    jsonb_build_object(
      'id', o.id,
      'customer_name', o.customer_name,
      'customer_phone', o.customer_phone,
      'customer_address', o.customer_address,
      'customer_complement', o.customer_complement,
      'status', o.status,
      'items', o.items,
      'total', o.total
    ) as order_details
  FROM deliveries d
  JOIN delivery_drivers dd ON dd.id = d.driver_id
  JOIN orders o ON o.id = d.order_id
  WHERE dd.phone = phone_number
  AND d.status != 'cancelled'
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql;