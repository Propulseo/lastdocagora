-- Table for professionals to block patients from booking
CREATE TABLE IF NOT EXISTS professional_blocked_patients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (professional_id, patient_id)
);

-- RLS policies
ALTER TABLE professional_blocked_patients ENABLE ROW LEVEL SECURITY;

-- Professionals can manage their own blocked patients
CREATE POLICY "professionals_manage_own_blocks"
  ON professional_blocked_patients
  FOR ALL
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Admins can view all blocks (service role bypasses RLS)
-- Patients can check if they are blocked (for booking validation)
CREATE POLICY "patients_read_own_blocks"
  ON professional_blocked_patients
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Index for fast lookups during booking
CREATE INDEX idx_blocked_patients_lookup
  ON professional_blocked_patients (professional_id, patient_id);
