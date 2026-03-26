-- TICKET-07: Clean up test/fake data from production database
-- Run this MANUALLY on Supabase SQL editor.
-- Review the SELECT queries first before running the DELETEs.

-- Step 1: Identify suspicious services
SELECT id, name, description, professional_id, is_active
FROM services
WHERE
  LOWER(name) IN ('test', 'teste', 'essai')
  OR name ILIKE '%invente%'
  OR name ILIKE '%inventé%'
  OR name ILIKE '%fake%'
  OR name ILIKE '%dummy%'
  OR name ILIKE '%placeholder%'
  OR name ILIKE '%lorem%'
  OR name ILIKE '%exemple%'
  OR name ILIKE '%example%'
  OR name ILIKE '%test service%';

-- Step 2: Deactivate suspicious services (safe — does not delete, just hides from UI)
-- Uncomment after reviewing Step 1 results:
/*
UPDATE services
SET is_active = false
WHERE
  LOWER(name) IN ('test', 'teste', 'essai')
  OR name ILIKE '%invente%'
  OR name ILIKE '%inventé%'
  OR name ILIKE '%fake%'
  OR name ILIKE '%dummy%'
  OR name ILIKE '%placeholder%'
  OR name ILIKE '%lorem%';
*/

-- Step 3: Identify test appointments (appointments linked to deactivated test services)
-- Review before taking action:
/*
SELECT a.id, a.appointment_date, a.status, s.name as service_name
FROM appointments a
JOIN services s ON a.service_id = s.id
WHERE s.is_active = false
  AND (
    LOWER(s.name) IN ('test', 'teste', 'essai')
    OR s.name ILIKE '%invente%'
    OR s.name ILIKE '%inventé%'
  );
*/
