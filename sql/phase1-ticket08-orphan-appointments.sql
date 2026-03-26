-- TICKET-08: Prevent orphan appointments and audit FK behavior
-- Run this MANUALLY on Supabase SQL editor.

-- Step 1: Audit current orphan appointments (patient_id references deleted patient)
SELECT a.id, a.patient_id, a.appointment_date, a.status
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.patient_id IS NOT NULL AND p.id IS NULL;

-- Step 2: Audit orphaned professional references
SELECT a.id, a.professional_id, a.appointment_date, a.status
FROM appointments a
LEFT JOIN professionals p ON a.professional_id = p.id
WHERE p.id IS NULL;

-- Step 3: Audit orphaned service references
SELECT a.id, a.service_id, a.appointment_date, a.status
FROM appointments a
LEFT JOIN services s ON a.service_id = s.id
WHERE a.service_id IS NOT NULL AND s.id IS NULL;

-- Step 4: Fix FK on appointments.patient_id → ON DELETE SET NULL
-- This preserves historical appointment data when a patient is removed.
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey,
  ADD CONSTRAINT appointments_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;

-- Step 5: Fix FK on appointments.service_id → ON DELETE SET NULL
-- Preserves appointment history when a service is deleted.
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_service_id_fkey,
  ADD CONSTRAINT appointments_service_id_fkey
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;

-- Step 6: Fix FK on appointments.created_by_user_id → ON DELETE SET NULL
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_created_by_user_id_fkey,
  ADD CONSTRAINT appointments_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Step 7: Protect professional_id — ON DELETE RESTRICT (cannot delete a pro with appointments)
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_professional_id_fkey,
  ADD CONSTRAINT appointments_professional_id_fkey
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE RESTRICT;

-- Step 8: Verify constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'appointments' AND tc.constraint_type = 'FOREIGN KEY';
