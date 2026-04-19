-- Partial unique index: prevents exact same slot double-booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_unique_slot
ON appointments (professional_id, appointment_date, appointment_time)
WHERE status NOT IN ('cancelled', 'rejected');

-- Atomic booking function: checks duration-based overlap + inserts in one transaction
CREATE OR REPLACE FUNCTION book_appointment_atomic(
  p_patient_id UUID,
  p_patient_user_id UUID,
  p_professional_id UUID,
  p_professional_user_id UUID,
  p_service_id UUID,
  p_appointment_date DATE,
  p_appointment_time TIME,
  p_duration_minutes INT,
  p_price NUMERIC,
  p_consultation_type TEXT,
  p_notes TEXT DEFAULT NULL,
  p_created_via TEXT DEFAULT 'patient_booking'
) RETURNS UUID AS $$
DECLARE
  v_start_min INT;
  v_end_min INT;
  v_conflict BOOLEAN;
  v_new_id UUID;
BEGIN
  v_start_min := EXTRACT(HOUR FROM p_appointment_time) * 60 + EXTRACT(MINUTE FROM p_appointment_time);
  v_end_min := v_start_min + p_duration_minutes;

  -- Lock rows for this professional+date to prevent concurrent inserts
  PERFORM 1 FROM appointments
  WHERE professional_id = p_professional_id
    AND appointment_date = p_appointment_date
    AND status NOT IN ('cancelled', 'rejected')
  FOR UPDATE;

  -- Check professional overlap
  SELECT EXISTS(
    SELECT 1 FROM appointments
    WHERE professional_id = p_professional_id
      AND appointment_date = p_appointment_date
      AND status NOT IN ('cancelled', 'rejected')
      AND (
        EXTRACT(HOUR FROM appointment_time) * 60 + EXTRACT(MINUTE FROM appointment_time)
      ) < v_end_min
      AND (
        EXTRACT(HOUR FROM appointment_time) * 60 + EXTRACT(MINUTE FROM appointment_time) + duration_minutes
      ) > v_start_min
  ) INTO v_conflict;

  IF v_conflict THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE';
  END IF;

  -- Check patient overlap (prevents patient double-booking)
  SELECT EXISTS(
    SELECT 1 FROM appointments
    WHERE patient_user_id = p_patient_user_id
      AND appointment_date = p_appointment_date
      AND status NOT IN ('cancelled', 'rejected')
      AND (
        EXTRACT(HOUR FROM appointment_time) * 60 + EXTRACT(MINUTE FROM appointment_time)
      ) < v_end_min
      AND (
        EXTRACT(HOUR FROM appointment_time) * 60 + EXTRACT(MINUTE FROM appointment_time) + duration_minutes
      ) > v_start_min
  ) INTO v_conflict;

  IF v_conflict THEN
    RAISE EXCEPTION 'PATIENT_SLOT_CONFLICT';
  END IF;

  -- Insert
  INSERT INTO appointments (
    patient_id, patient_user_id, professional_id, professional_user_id,
    service_id, appointment_date, appointment_time, duration_minutes,
    price, consultation_type, status, notes, created_via
  ) VALUES (
    p_patient_id, p_patient_user_id, p_professional_id, p_professional_user_id,
    p_service_id, p_appointment_date, p_appointment_time, p_duration_minutes,
    p_price, p_consultation_type, 'pending', p_notes, p_created_via
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;
