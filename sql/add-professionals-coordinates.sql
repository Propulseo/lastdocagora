ALTER TABLE professionals ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS longitude double precision;
CREATE INDEX IF NOT EXISTS idx_professionals_coords
  ON professionals (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
