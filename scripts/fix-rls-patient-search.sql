-- ============================================================
-- RLS Policies pour la recherche patient (classique + IA)
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard > SQL Editor > New query
-- ============================================================

-- 1. PROFESSIONALS — les utilisateurs authentifiés peuvent lire tous les profils
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'professionals' AND policyname = 'Authenticated users can read professionals'
  ) THEN
    CREATE POLICY "Authenticated users can read professionals"
      ON professionals FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 2. USERS — lecture publique des infos de base (nom, avatar) liées aux professionnels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Authenticated users can read user profiles'
  ) THEN
    CREATE POLICY "Authenticated users can read user profiles"
      ON users FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 3. SERVICES — les patients peuvent voir les services actifs des professionnels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Authenticated users can read active services'
  ) THEN
    CREATE POLICY "Authenticated users can read active services"
      ON services FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;

-- 4. AVAILABILITY — lecture pour le booking et la RPC get_next_available_slot
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'availability' AND policyname = 'Authenticated users can read availability'
  ) THEN
    CREATE POLICY "Authenticated users can read availability"
      ON availability FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 5. APPOINTMENT_RATINGS — lecture des avis sur les professionnels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'appointment_ratings' AND policyname = 'Authenticated users can read ratings'
  ) THEN
    CREATE POLICY "Authenticated users can read ratings"
      ON appointment_ratings FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 6. PATIENTS — un patient peut lire son propre profil (pour le booking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Patients can read own profile'
  ) THEN
    CREATE POLICY "Patients can read own profile"
      ON patients FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 7. APPOINTMENTS — un patient peut créer un rendez-vous
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Patients can insert appointments'
  ) THEN
    CREATE POLICY "Patients can insert appointments"
      ON appointments FOR INSERT
      TO authenticated
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- 8. APPOINTMENTS — un patient peut lire ses propres rendez-vous
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Patients can read own appointments'
  ) THEN
    CREATE POLICY "Patients can read own appointments"
      ON appointments FOR SELECT
      TO authenticated
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- Vérification
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('professionals', 'users', 'services', 'availability', 'appointment_ratings', 'patients', 'appointments')
ORDER BY tablename, policyname;
