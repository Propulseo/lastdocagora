ALTER TABLE professionals
DROP CONSTRAINT professionals_verification_status_check;

ALTER TABLE professionals
ADD CONSTRAINT professionals_verification_status_check
CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended'));
