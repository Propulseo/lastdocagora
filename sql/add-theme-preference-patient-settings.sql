-- Add theme_preference column to patient_settings
ALTER TABLE patient_settings
ADD COLUMN IF NOT EXISTS theme_preference varchar(10) DEFAULT 'system';

-- Backfill from existing dark_mode boolean
UPDATE patient_settings
SET theme_preference = CASE WHEN dark_mode = true THEN 'dark' ELSE 'light' END
WHERE dark_mode IS NOT NULL;
