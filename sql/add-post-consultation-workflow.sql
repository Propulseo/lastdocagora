-- Migration: add_post_consultation_workflow
-- Tables: consultation_notes, review_requests
-- Alter: reviews (add sub-ratings, moderation, reply)
-- Function: get_professional_rating_stats

-- 1. consultation_notes
CREATE TABLE consultation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  follow_up_needed BOOLEAN NOT NULL DEFAULT false,
  follow_up_suggested_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_consultation_notes_appointment UNIQUE (appointment_id)
);

ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pro_own_notes_select" ON consultation_notes
  FOR SELECT USING (professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid()));
CREATE POLICY "pro_own_notes_insert" ON consultation_notes
  FOR INSERT WITH CHECK (professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid()));
CREATE POLICY "pro_own_notes_update" ON consultation_notes
  FOR UPDATE USING (professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid()));
CREATE POLICY "admin_consultation_notes" ON consultation_notes
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 2. ALTER reviews
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS rating_punctuality INTEGER CHECK (rating_punctuality >= 1 AND rating_punctuality <= 5),
  ADD COLUMN IF NOT EXISTS rating_listening INTEGER CHECK (rating_listening >= 1 AND rating_listening <= 5),
  ADD COLUMN IF NOT EXISTS rating_clarity INTEGER CHECK (rating_clarity >= 1 AND rating_clarity <= 5),
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS professional_reply TEXT CHECK (char_length(professional_reply) <= 500),
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP POLICY IF EXISTS "reader" ON reviews;
CREATE POLICY "public_read_approved" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "pro_reply_reviews" ON reviews
  FOR UPDATE USING (status = 'approved' AND professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid()))
  WITH CHECK (status = 'approved' AND professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reviews_professional_status ON reviews(professional_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_professional_created ON reviews(professional_id, created_at DESC);

-- 3. review_requests
CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  declined BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_review_requests_appointment UNIQUE (appointment_id)
);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients_read_own_requests" ON review_requests
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "admin_review_requests" ON review_requests
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 4. get_professional_rating_stats
CREATE OR REPLACE FUNCTION get_professional_rating_stats(professional_uuid UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'average_rating', ROUND((SUM(r.rating * w.weight) / NULLIF(SUM(w.weight), 0))::numeric, 1),
    'total_reviews', COUNT(*)::integer,
    'average_punctuality', ROUND((SUM(r.rating_punctuality * w.weight) / NULLIF(SUM(CASE WHEN r.rating_punctuality IS NOT NULL THEN w.weight ELSE 0 END), 0))::numeric, 1),
    'average_listening', ROUND((SUM(r.rating_listening * w.weight) / NULLIF(SUM(CASE WHEN r.rating_listening IS NOT NULL THEN w.weight ELSE 0 END), 0))::numeric, 1),
    'average_clarity', ROUND((SUM(r.rating_clarity * w.weight) / NULLIF(SUM(CASE WHEN r.rating_clarity IS NOT NULL THEN w.weight ELSE 0 END), 0))::numeric, 1)
  ) INTO result
  FROM reviews r
  CROSS JOIN LATERAL (SELECT CASE WHEN r.created_at < NOW() - INTERVAL '6 months' THEN 0.7 ELSE 1.0 END AS weight) w
  WHERE r.professional_id = professional_uuid AND r.status = 'approved';
  IF result IS NULL OR (result->>'total_reviews')::integer = 0 THEN
    RETURN json_build_object('average_rating', 0, 'total_reviews', 0, 'average_punctuality', NULL, 'average_listening', NULL, 'average_clarity', NULL);
  END IF;
  RETURN result;
END; $$;
