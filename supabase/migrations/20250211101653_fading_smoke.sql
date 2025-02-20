-- Add business_hours column to businesses table
ALTER TABLE businesses
ADD COLUMN business_hours jsonb;

-- Create index for faster lookups
CREATE INDEX businesses_business_hours_idx ON businesses USING gin(business_hours);

-- Update existing businesses with default hours
UPDATE businesses
SET business_hours = '{
  "monday": {"open": "09:00", "close": "18:00"},
  "tuesday": {"open": "09:00", "close": "18:00"},
  "wednesday": {"open": "09:00", "close": "18:00"},
  "thursday": {"open": "09:00", "close": "18:00"},
  "friday": {"open": "09:00", "close": "18:00"},
  "saturday": {"open": "09:00", "close": "18:00"},
  "sunday": null
}'::jsonb
WHERE business_hours IS NULL;