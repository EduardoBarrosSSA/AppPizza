-- Add slug field to businesses
ALTER TABLE businesses
ADD COLUMN slug text UNIQUE;

-- Create function to generate slug
CREATE OR REPLACE FUNCTION generate_slug(name text)
RETURNS text AS $$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 1;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  new_slug := base_slug;
  -- Keep trying with incremented numbers until we find a unique slug
  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter::text;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing businesses
DO $$
DECLARE
  b RECORD;
BEGIN
  FOR b IN SELECT id, name FROM businesses WHERE slug IS NULL LOOP
    UPDATE businesses
    SET slug = generate_slug(b.name)
    WHERE id = b.id;
  END LOOP;
END $$;

-- Make slug required for new businesses
ALTER TABLE businesses
ALTER COLUMN slug SET NOT NULL;

-- Create trigger to automatically generate slug
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_slug_trigger
BEFORE INSERT ON businesses
FOR EACH ROW
EXECUTE FUNCTION auto_generate_slug();

-- Create index for faster slug lookups
CREATE INDEX businesses_slug_idx ON businesses(slug);