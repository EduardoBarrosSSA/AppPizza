/*
  # Adicionar Sistema de Assinaturas

  1. Novas Tabelas
    - `subscription_plans`: Planos de assinatura disponíveis
    - `business_subscriptions`: Assinaturas ativas dos estabelecimentos

  2. Alterações
    - Adiciona coluna `subscription_id` na tabela `businesses`

  3. Dados Iniciais
    - Insere os planos básico, profissional e ilimitado
*/

-- Criar enum para status da assinatura
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');

-- Criar tabela de planos
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  features jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de assinaturas
CREATE TABLE business_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar coluna de assinatura na tabela businesses
ALTER TABLE businesses
ADD COLUMN subscription_id uuid REFERENCES business_subscriptions(id);

-- Criar índices
CREATE INDEX business_subscriptions_business_id_idx ON business_subscriptions(business_id);
CREATE INDEX business_subscriptions_plan_id_idx ON business_subscriptions(plan_id);
CREATE INDEX business_subscriptions_status_idx ON business_subscriptions(status);
CREATE INDEX businesses_subscription_id_idx ON businesses(subscription_id);

-- Habilitar RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para planos
CREATE POLICY "Leitura pública de planos"
  ON subscription_plans
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Apenas system_admin pode gerenciar planos"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- Políticas para assinaturas
CREATE POLICY "Estabelecimentos podem ver suas assinaturas"
  ON business_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System admin pode gerenciar assinaturas"
  ON business_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- Inserir planos iniciais
INSERT INTO subscription_plans (name, description, price, features) VALUES
(
  'Básico',
  'Ideal para pequenos estabelecimentos',
  49.90,
  '{
    "max_products": 30,
    "max_categories": 3,
    "allows_delivery": true,
    "allows_reviews": true,
    "max_images_per_product": 1,
    "support_level": "email"
  }'::jsonb
),
(
  'Profissional',
  'Para estabelecimentos em crescimento',
  99.90,
  '{
    "max_products": 100,
    "max_categories": 10,
    "allows_delivery": true,
    "allows_reviews": true,
    "allows_ingredients": true,
    "max_images_per_product": 5,
    "support_level": "priority",
    "allows_analytics": true
  }'::jsonb
),
(
  'Ilimitado',
  'Recursos completos para grandes estabelecimentos',
  199.90,
  '{
    "max_products": -1,
    "max_categories": -1,
    "allows_delivery": true,
    "allows_reviews": true,
    "allows_ingredients": true,
    "max_images_per_product": -1,
    "support_level": "dedicated",
    "allows_analytics": true,
    "allows_api_access": true,
    "allows_custom_domain": true
  }'::jsonb
);

-- Criar função para verificar limites do plano
CREATE OR REPLACE FUNCTION check_subscription_limits(
  business_id uuid,
  feature text,
  required_value integer DEFAULT 1
) RETURNS boolean AS $$
DECLARE
  subscription record;
  plan record;
BEGIN
  -- Buscar assinatura ativa
  SELECT * INTO subscription
  FROM business_subscriptions bs
  WHERE bs.business_id = $1
  AND bs.status = 'active'
  AND bs.expires_at > now()
  ORDER BY expires_at DESC
  LIMIT 1;

  -- Se não houver assinatura ativa, não permite
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Buscar plano
  SELECT * INTO plan
  FROM subscription_plans
  WHERE id = subscription.plan_id;

  -- Verificar limite do recurso
  IF plan.features->$2 IS NULL THEN
    RETURN false;
  END IF;

  -- Se o limite for -1, significa ilimitado
  IF (plan.features->>$2)::integer = -1 THEN
    RETURN true;
  END IF;

  -- Verificar se está dentro do limite
  RETURN (plan.features->>$2)::integer >= $3;
END;
$$ LANGUAGE plpgsql;