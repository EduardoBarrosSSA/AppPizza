-- Drop existing policies
DROP POLICY IF EXISTS "Business admins can manage deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can read and update assigned deliveries" ON deliveries;

-- Create new policies for deliveries
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

CREATE POLICY "Drivers can read their deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM delivery_drivers
      WHERE phone = auth.uid()::text
    )
  );

CREATE POLICY "Drivers can update their assigned deliveries"
  ON deliveries
  FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM delivery_drivers
      WHERE phone = auth.uid()::text
    )
  );

-- Create function to handle delivery status changes
CREATE OR REPLACE FUNCTION handle_delivery_status_change()
RETURNS trigger AS $$
BEGIN
  -- Set completed_at when status becomes completed
  IF NEW.status = 'completed' AND 
     (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status != COALESCE(OLD.status, 'assigned'))) THEN
    NEW.completed_at = now();
    
    -- Update order status
    UPDATE orders 
    SET status = 'delivered'
    WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS handle_delivery_status_change_trigger ON deliveries;
CREATE TRIGGER handle_delivery_status_change_trigger
  BEFORE INSERT OR UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION handle_delivery_status_change();

-- Create function to validate delivery data
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

  -- Validate status value
  IF NEW.status NOT IN ('assigned', 'picked_up', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  -- Validate driver exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM delivery_drivers
    WHERE id = NEW.driver_id
    AND active = true
  ) THEN
    RAISE EXCEPTION 'Driver not found or inactive';
  END IF;

  -- Validate order exists
  IF NOT EXISTS (
    SELECT 1 FROM orders
    WHERE id = NEW.order_id
  ) THEN
    RAISE EXCEPTION 'Order not found';
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