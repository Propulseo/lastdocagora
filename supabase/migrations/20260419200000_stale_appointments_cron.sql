-- Cron job: auto-mark stale appointments as no-show after 24h without attendance
-- Runs every hour; targets confirmed/pending appointments whose end time is >24h ago
-- and have no attendance record (or attendance still "waiting")
SELECT cron.schedule(
  'auto-noshow-stale-appointments',
  '30 * * * *',  -- every hour at :30
  $$
    -- Step 1: Mark stale appointments as no-show, collecting patient/date info
    WITH stale AS (
      SELECT a.id, a.professional_user_id, a.appointment_date, a.appointment_time,
             COALESCE(u.first_name || ' ' || u.last_name, a.title, 'Paciente') AS patient_name
      FROM appointments a
      LEFT JOIN appointment_attendance aa ON aa.appointment_id = a.id
      LEFT JOIN users u ON u.id = a.patient_user_id
      WHERE a.status IN ('confirmed', 'pending')
        AND (
          a.appointment_date + a.appointment_time + (COALESCE(a.duration_minutes, 30) || ' minutes')::interval
        ) < now() - interval '24 hours'
        AND (aa.status IS NULL OR aa.status = 'waiting')
    ),
    updated AS (
      UPDATE appointments
      SET status = 'no-show', updated_at = now()
      FROM stale
      WHERE appointments.id = stale.id
      RETURNING appointments.id, stale.professional_user_id,
               stale.patient_name, stale.appointment_date, stale.appointment_time
    )
    -- Step 2: Create admin alert for each stale appointment with readable info
    INSERT INTO notifications (user_id, title, message, type, related_id, params)
    SELECT
      admin_users.id,
      'No-show automático',
      updated.patient_name || ' — ' || to_char(updated.appointment_date, 'DD/MM/YYYY') || ' às ' || to_char(updated.appointment_time, 'HH24:MI') || ' — sem presença após 24h.',
      'admin_stale_noshow',
      updated.id,
      jsonb_build_object(
        'appointmentId', updated.id,
        'patientName', updated.patient_name,
        'date', to_char(updated.appointment_date, 'DD/MM/YYYY'),
        'time', to_char(updated.appointment_time, 'HH24:MI')
      )
    FROM updated
    CROSS JOIN (SELECT id FROM users WHERE role = 'admin') AS admin_users;
  $$
);
