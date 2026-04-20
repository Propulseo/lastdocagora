-- Migration: allow reviews.patient_id to be NULL for anonymized reviews
-- When a patient deletes their account, approved reviews are preserved
-- with is_anonymous = true and patient_id = NULL (RGPD compliant)

ALTER TABLE reviews ALTER COLUMN patient_id DROP NOT NULL;
