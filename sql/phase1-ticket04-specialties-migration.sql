-- TICKET-04: Migrate French specialty values → canonical keys
-- Run this MANUALLY on Supabase SQL editor.
-- SAFE: uses UPDATE with WHERE, no data loss.

BEGIN;

UPDATE professionals
SET specialty = CASE specialty
  WHEN 'Médecin Généraliste' THEN 'general_practitioner'
  WHEN 'Cardiologie'         THEN 'cardiology'
  WHEN 'Dentiste'            THEN 'dentist'
  WHEN 'Dermatologie'        THEN 'dermatology'
  WHEN 'Gynécologie'         THEN 'gynecology'
  WHEN 'Neurologie'          THEN 'neurology'
  WHEN 'Ophtalmologie'       THEN 'ophthalmology'
  WHEN 'Orthopédie'          THEN 'orthopedics'
  WHEN 'Pédiatrie'           THEN 'pediatrics'
  WHEN 'Psychiatrie'         THEN 'psychiatry'
  ELSE specialty  -- leave unknown values untouched
END
WHERE specialty IN (
  'Médecin Généraliste', 'Cardiologie', 'Dentiste',
  'Dermatologie', 'Gynécologie', 'Neurologie',
  'Ophtalmologie', 'Orthopédie', 'Pédiatrie', 'Psychiatrie'
);

-- Verify migration
SELECT specialty, COUNT(*) FROM professionals GROUP BY specialty ORDER BY specialty;

COMMIT;
