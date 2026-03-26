-- TICKET-09: Prevent self-booking at database level
-- Run this MANUALLY on Supabase SQL editor.

-- Step 1: Audit existing self-bookings
SELECT a.id, a.patient_user_id, a.professional_user_id, a.appointment_date, a.status
FROM appointments a
WHERE a.patient_user_id = a.professional_user_id;

-- Step 2: Add CHECK constraint to prevent future self-bookings
ALTER TABLE appointments
  ADD CONSTRAINT chk_no_self_booking
  CHECK (patient_user_id IS NULL OR patient_user_id <> professional_user_id);

-- Note: If Step 1 found existing rows, you must resolve them first
-- (cancel or nullify patient_user_id) before adding the constraint.
-- Example cleanup:
-- UPDATE appointments SET status = 'cancelled' WHERE patient_user_id = professional_user_id;
