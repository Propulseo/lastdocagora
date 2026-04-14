-- Migration: add_reviews_constraints
-- Adds UNIQUE constraint and missing RLS policies on reviews table

-- 1. UNIQUE constraint on (appointment_id, patient_id)
DO $$ BEGIN
  ALTER TABLE reviews ADD CONSTRAINT uq_review_appointment_patient UNIQUE (appointment_id, patient_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. RLS policies for reviews
-- Patient can see their own reviews
DROP POLICY IF EXISTS "patient_read_own_reviews" ON reviews;
CREATE POLICY "patient_read_own_reviews" ON reviews
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- Patient can insert a review they authored
DROP POLICY IF EXISTS "patient_insert_own_review" ON reviews;
CREATE POLICY "patient_insert_own_review" ON reviews
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- Admin can do everything
DROP POLICY IF EXISTS "admin_all_reviews" ON reviews;
CREATE POLICY "admin_all_reviews" ON reviews
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
