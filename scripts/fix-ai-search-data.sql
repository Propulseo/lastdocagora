-- Fix AI Search Data
-- Run these commands in Supabase Dashboard SQL Editor

-- 1. Check current RLS policies on professionals table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'professionals';

-- 2. Verify how many professionals have each verification_status
SELECT verification_status, COUNT(*)
FROM professionals
GROUP BY verification_status;

-- 3. Update test/seed professionals to 'verified' status (adjust WHERE as needed)
-- UPDATE professionals SET verification_status = 'verified' WHERE verification_status IS NULL OR verification_status = 'pending';

-- 4. Check languages_spoken population
SELECT id, languages_spoken
FROM professionals
WHERE languages_spoken IS NULL OR array_length(languages_spoken, 1) IS NULL;

-- 5. Populate empty languages_spoken with default ['pt'] (Portuguese)
-- UPDATE professionals SET languages_spoken = ARRAY['pt'] WHERE languages_spoken IS NULL OR array_length(languages_spoken, 1) IS NULL;

-- 6. Check city name consistency
SELECT DISTINCT city, COUNT(*)
FROM professionals
WHERE city IS NOT NULL
GROUP BY city
ORDER BY city;

-- 7. Normalize common city name variants to Portuguese
-- UPDATE professionals SET city = 'Lisboa' WHERE LOWER(city) IN ('lisbon', 'lisbonne');
-- UPDATE professionals SET city = 'Porto' WHERE LOWER(city) IN ('oporto');

-- 8. Verify final state of verified professionals
SELECT COUNT(*) as verified_count
FROM professionals
WHERE verification_status = 'verified';
