-- Cron job: auto-mark stale appointments as no-show after 24h without attendance
-- Runs every hour; targets confirmed/pending appointments whose end time is >24h ago
-- and have no attendance record (or attendance still "waiting")
SELECT cron.schedule(
  'auto-noshow-stale-appointments',
  '30 * * * *',  -- every hour at :30
  $$
    -- Step 1: Mark stale appointments as no-show
    WITH stale AS (
      SELECT a.id, a.professional_user_id
      FROM appointments a
      LEFT JOIN appointment_attendance aa ON aa.appointment_id = a.id
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
      RETURNING appointments.id, stale.professional_user_id
    )
    -- Step 2: Create admin alert for each stale appointment
    INSERT INTO notifications (user_id, title, message, type, related_id, params)
    SELECT
      admin_users.id,
      'Stale appointment auto-marked no-show',
      'Appointment ' || updated.id || ' had no attendance after 24h and was auto-marked as no-show.',
      'admin_stale_noshow',
      updated.id,
      jsonb_build_object('appointmentId', updated.id)
    FROM updated
    CROSS JOIN (SELECT id FROM users WHERE role = 'admin') AS admin_users;
  $$
);
