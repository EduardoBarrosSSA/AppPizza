-- Drop existing policies for deliveries
DROP POLICY IF EXISTS "Drivers can read assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can update own deliveries" ON deliveries;

-- Create new policies for deliveries table
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

CREATE POLICY "Drivers can read and update assigned deliveries"
  ON deliveries
  FOR ALL
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM delivery_drivers
      WHERE phone = auth.uid()::text
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS deliveries_order_id_idx ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS deliveries_driver_id_idx ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS deliveries_status_idx ON deliveries(status);

-- Add function to validate delivery data
CREATE OR REPLACE FUNCTION validate_delivery_data()
RETURNS trigger AS $$
BEGIN
  -- Ensure required fields are present
  IF NEW.order_id IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;

  IF NEW.driver_id IS NULL THEN
    RAISE EXCEPTION 'driver_id is required';
  END IF;

  IF NEW.status IS NULL THEN
    RAISE EXCEPTION 'status is required';
  END IF;

  -- Validate status
  IF NEW.status NOT IN ('assigned', 'picked_up', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  -- Set completed_at when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for data validation
DROP TRIGGER IF EXISTS validate_delivery_data_trigger ON deliveries;
CREATE TRIGGER validate_delivery_data_trigger
  BEFORE INSERT OR UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION validate_delivery_data();