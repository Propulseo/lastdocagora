-- Add attendance tracking columns to patients table
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS absence_count INT DEFAULT 0 NOT NULL;

-- Index for quick lookup of frequent absentees
CREATE INDEX IF NOT EXISTS idx_patients_absence_count
  ON patients (absence_count)
  WHERE absence_count >= 3;
