/*
  # Add Price Unit to Products Table

  1. Changes
    - Add price_unit column to products table
    - Set default value to 'unit'
    - Update existing products
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add price_unit column to products table
ALTER TABLE products 
ADD COLUMN price_unit text NOT NULL DEFAULT 'unit'
CHECK (price_unit IN ('unit', 'kg', 'g', 'l', 'ml'));

-- Update existing products to use 'unit' as default
UPDATE products 
SET price_unit = 'unit' 
WHERE price_unit IS NULL;