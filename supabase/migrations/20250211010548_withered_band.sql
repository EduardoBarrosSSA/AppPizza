/*
  # Add reviews table

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key to businesses)
      - `user_id` (uuid, foreign key to auth.users)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `reviews` table
    - Add policies for:
      - Public can read reviews
      - Authenticated users can create reviews for businesses
      - Users can only edit/delete their own reviews
*/

-- Create reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  -- Prevent multiple reviews from same user for same business
  UNIQUE(business_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX reviews_business_id_idx ON reviews(business_id);
CREATE INDEX reviews_user_id_idx ON reviews(user_id);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can read reviews"
  ON reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to calculate average rating
CREATE OR REPLACE FUNCTION get_business_rating(business_id uuid)
RETURNS TABLE (
  average_rating numeric,
  review_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(rating)::numeric, 1) as average_rating,
    COUNT(*)::bigint as review_count
  FROM reviews
  WHERE reviews.business_id = $1;
END;
$$ LANGUAGE plpgsql;