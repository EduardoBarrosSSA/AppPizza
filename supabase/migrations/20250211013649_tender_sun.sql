/*
  # Add business address fields

  1. Changes
    - Add address fields to businesses table:
      - `cep` (text)
      - `street` (text)
      - `number` (text)
      - `complement` (text)
      - `neighborhood` (text)
      - `city` (text)
      - `state` (text)
*/

ALTER TABLE businesses
ADD COLUMN cep text,
ADD COLUMN street text,
ADD COLUMN number text,
ADD COLUMN complement text,
ADD COLUMN neighborhood text,
ADD COLUMN city text,
ADD COLUMN state text;