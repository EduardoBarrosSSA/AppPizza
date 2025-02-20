-- Adicionar colunas na tabela products
ALTER TABLE products
ADD COLUMN category text,
ADD COLUMN allows_multiple_flavors boolean DEFAULT false;

-- Criar tabela de ingredientes
CREATE TABLE product_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  optional boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Criar índices
CREATE INDEX product_ingredients_product_id_idx ON product_ingredients(product_id);

-- Habilitar RLS
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Leitura pública de ingredientes"
  ON product_ingredients
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Administradores podem gerenciar ingredientes"
  ON product_ingredients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN products prod ON prod.business_id = p.business_id
      WHERE p.user_id = auth.uid()
      AND p.role = 'business_admin'
      AND prod.id = product_ingredients.product_id
    )
  );