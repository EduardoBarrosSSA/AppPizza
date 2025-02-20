-- Drop existing policies
DROP POLICY IF EXISTS "Drivers can read their deliveries" ON deliveries;
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
      WHERE phone = SPLIT_PART(auth.email(), '@', 1)
      AND active = true
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

-- Create function to get driver deliveries with better error handling
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
  -- Validate phone number format
  IF NOT phone_number ~ '^[0-9]{10,11}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  -- Check if driver exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM delivery_drivers
    WHERE phone = phone_number
    AND active = true
  ) THEN
    RAISE EXCEPTION 'Driver not found or inactive';
  END IF;

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
      'total', o.total,
      'business_id', o.business_id
    ) as order_details
  FROM deliveries d
  JOIN delivery_drivers dd ON dd.id = d.driver_id
  JOIN orders o ON o.id = d.order_id
  WHERE dd.phone = phone_number
  AND d.status != 'cancelled'
  ORDER BY 
    CASE 
      WHEN d.status = 'assigned' THEN 1
      WHEN d.status = 'picked_up' THEN 2
      ELSE 3
    END,
    d.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get driver stats
CREATE OR REPLACE FUNCTION get_driver_stats(phone_number text)
RETURNS TABLE (
  total_deliveries bigint,
  total_earnings numeric,
  pending_deliveries bigint
) AS $$
DECLARE
  today_start timestamptz;
BEGIN
  -- Set today's start time
  today_start := date_trunc('day', now());

  -- Validate phone number format
  IF NOT phone_number ~ '^[0-9]{10,11}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  RETURN QUERY
  WITH driver_deliveries AS (
    SELECT d.*
    FROM deliveries d
    JOIN delivery_drivers dd ON dd.id = d.driver_id
    WHERE dd.phone = phone_number
    AND dd.active = true
  )
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed' AND created_at >= today_start)::bigint as total_deliveries,
    COALESCE(SUM(fee) FILTER (WHERE status = 'completed' AND created_at >= today_start), 0) as total_earnings,
    COUNT(*) FILTER (WHERE status IN ('assigned', 'picked_up'))::bigint as pending_deliveries
  FROM driver_deliveries;
END;
$$ LANGUAGE plpgsql;