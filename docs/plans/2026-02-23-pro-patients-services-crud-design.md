# Professional Patients & Services CRUD — Design

## Goal

Enable full CRUD for professional-managed patients and services, stored in Supabase with RLS, no mock data, production-ready.

## Decisions

- **Patient auth**: Record-only (no login). Patients created by pros exist in `users` + `patients` tables but have no `auth.users` entry.
- **Pro-patient link**: `created_by_professional_id` column on `patients` table (not a junction table).
- **Service fields**: name, description, duration_minutes, active only. Price defaults to 0, consultation_type defaults to 'in-person'. No pricing UI.
- **UI sync**: `revalidatePath` + toast feedback. No optimistic updates for MVP.

## Schema Changes

### Migration: Add `created_by_professional_id` to patients

```sql
ALTER TABLE patients
  ADD COLUMN created_by_professional_id uuid REFERENCES professionals(id);

-- Backfill existing patients from appointment data
UPDATE patients p
SET created_by_professional_id = (
  SELECT a.professional_id
  FROM appointments a
  WHERE a.patient_id = p.id
  ORDER BY a.created_at ASC
  LIMIT 1
)
WHERE p.created_by_professional_id IS NULL;
```

### Update `create_patient_for_pro` function

Modify to accept and set `created_by_professional_id` using the calling professional's professionals.id.

## RLS Policies

### patients table (new policies)

- `pro_select_own_patients` (SELECT): `created_by_professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())`
- `pro_insert_own_patients` (INSERT): same condition on `WITH CHECK`
- `pro_update_own_patients` (UPDATE): same condition
- `pro_delete_own_patients` (DELETE): same condition
- Keep existing `pro_via_appointments` for backward compat

### users table (new policies)

- `pro_insert_patient_users` (INSERT): `WITH CHECK (role = 'patient' AND is_professional())`
- `pro_select_created_patients` (SELECT): via join with patients.created_by_professional_id

### services table

Already correct. No changes needed.

## Server Actions

### Patient actions (`src/app/(professional)/_actions/patients.ts`)

- `createPatient(formData)` — calls `create_patient_for_pro` RPC, revalidates
- `updatePatient(patientId, formData)` — direct update on patients table
- `deletePatient(patientId)` — delete from patients (cascade consideration: only if no appointments)

### Service actions (`src/app/(professional)/_actions/services.ts`)

- `createService(formData)` — insert into services with professional_id + professional_user_id
- `updateService(serviceId, formData)` — update by id
- `deleteService(serviceId)` — delete by id (only if not referenced by appointments, or soft-delete via is_active=false)

## UI Components

### Patients

- `CreatePatientDialog` — form: first_name, last_name, email (optional), phone (optional)
- `EditPatientDialog` — same fields, pre-filled
- `DeletePatientDialog` — AlertDialog confirmation
- Refactor patients page to split into server page + client table component

### Services

- `CreateServiceDialog` — form: name, description, duration_minutes, active toggle
- `EditServiceDialog` — same fields, pre-filled
- `DeleteServiceDialog` — AlertDialog confirmation
- Refactor services page to split into server page + client table component

## Validation (Zod)

### Patient schema
- first_name: required, min 2, max 100
- last_name: required, min 2, max 100
- email: optional, valid email format
- phone: optional, validated format

### Service schema
- name: required, min 2, max 100
- description: optional, max 500
- duration_minutes: required, integer, > 0, <= 480
- is_active: boolean, default true

## i18n

Add translation keys to `pt/professional.json` and `fr/professional.json` for all new UI strings.

## File Structure

```
src/app/(professional)/
  _actions/
    patients.ts          (new)
    services.ts          (new)
  pro/patients/
    page.tsx             (refactor: server data + client component)
    _components/
      patients-table.tsx (new: client component with CRUD dialogs)
      create-patient-dialog.tsx (new)
      edit-patient-dialog.tsx   (new)
      delete-patient-dialog.tsx (new)
  pro/services/
    page.tsx             (refactor: server data + client component)
    _components/
      services-table.tsx (new: client component with CRUD dialogs)
      create-service-dialog.tsx (new)
      edit-service-dialog.tsx   (new)
      delete-service-dialog.tsx (new)
```
