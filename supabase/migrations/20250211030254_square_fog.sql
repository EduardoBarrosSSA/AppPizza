/*
  # Sistema de Entregadores

  1. Novas Tabelas
    - `delivery_drivers` - Cadastro de entregadores
      - `id` (uuid, primary key)
      - `phone` (text, unique) - Telefone usado como login
      - `name` (text) - Nome do entregador
      - `active` (boolean) - Status do entregador
      - `created_at` (timestamptz)
      
    - `deliveries` - Registro de entregas
      - `id` (uuid, primary key)
      - `order_id` (uuid) - Referência ao pedido
      - `driver_id` (uuid) - Referência ao entregador
      - `fee` (numeric) - Taxa da entrega
      - `status` (text) - Status da entrega
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas para entregadores
*/

-- Create delivery drivers table
CREATE TABLE delivery_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create deliveries table
CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  driver_id uuid REFERENCES delivery_drivers(id) NOT NULL,
  fee numeric NOT NULL DEFAULT 5.00,
  status text NOT NULL CHECK (status IN ('assigned', 'picked_up', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(order_id)
);

-- Create indexes
CREATE INDEX deliveries_driver_id_idx ON deliveries(driver_id);
CREATE INDEX deliveries_order_id_idx ON deliveries(order_id);
CREATE INDEX deliveries_status_idx ON deliveries(status);

-- Enable RLS
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Policies for delivery drivers
CREATE POLICY "Drivers can read own profile"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = phone -- O ID do usuário será o número do telefone
  );

-- Policies for deliveries
CREATE POLICY "Drivers can read assigned deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM delivery_drivers
      WHERE phone = auth.uid()::text
    )
  );

CREATE POLICY "Drivers can update own deliveries"
  ON deliveries
  FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM delivery_drivers
      WHERE phone = auth.uid()::text
    )
  );

-- Create function to calculate driver earnings
CREATE OR REPLACE FUNCTION get_driver_earnings(
  driver_id uuid,
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  total_deliveries bigint,
  total_earnings numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_deliveries,
    COALESCE(SUM(fee), 0) as total_earnings
  FROM deliveries
  WHERE
    deliveries.driver_id = $1
    AND status = 'completed'
    AND ($2 IS NULL OR completed_at >= $2)
    AND ($3 IS NULL OR completed_at <= $3);
END;
$$ LANGUAGE plpgsql;