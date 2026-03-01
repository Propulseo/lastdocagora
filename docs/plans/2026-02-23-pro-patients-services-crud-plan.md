# Professional Patients & Services CRUD — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable full CRUD for professional-managed patients and services, stored in Supabase with RLS protection, no mock data.

**Architecture:** Server actions pattern matching existing `src/app/(professional)/_actions/attendance.ts`. Server page fetches data, passes to client table component that contains CRUD dialogs. Zod validation on both client and server. `revalidatePath` for UI sync. i18n via existing `getProfessionalI18n` (server) / `useProfessionalI18n` (client).

**Tech Stack:** Next.js 16 App Router, Supabase (RLS + RPC), shadcn/ui dialogs, react-hook-form + zod, Sonner toasts

---

## Task 1: Install alert-dialog shadcn component

**Files:**
- Create: `src/components/ui/alert-dialog.tsx`

**Step 1: Install the component**

Run: `npx shadcn@latest add alert-dialog`
Expected: Component created at `src/components/ui/alert-dialog.tsx`

**Step 2: Commit**

```bash
git add src/components/ui/alert-dialog.tsx
git commit -m "chore: add shadcn alert-dialog component"
```

---

## Task 2: Database migration — add `created_by_professional_id` to patients + update RLS + update RPC

**Files:**
- Modify: Supabase DB via `apply_migration`

**Step 1: Apply migration to add column and backfill**

Apply migration `add_created_by_professional_id_to_patients`:

```sql
-- Add column
ALTER TABLE patients
  ADD COLUMN created_by_professional_id uuid REFERENCES professionals(id);

-- Backfill from earliest appointment per patient
UPDATE patients p
SET created_by_professional_id = sub.professional_id
FROM (
  SELECT DISTINCT ON (patient_id) patient_id, professional_id
  FROM appointments
  ORDER BY patient_id, created_at ASC
) sub
WHERE sub.patient_id = p.id
  AND p.created_by_professional_id IS NULL;
```

**Step 2: Apply migration for new RLS policies on patients**

Apply migration `add_pro_patient_rls_policies`:

```sql
-- Pro can SELECT patients they created
CREATE POLICY pro_select_own_patients ON patients
  FOR SELECT TO authenticated
  USING (
    created_by_professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Pro can INSERT patients they own
CREATE POLICY pro_insert_own_patients ON patients
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Pro can UPDATE patients they created
CREATE POLICY pro_update_own_patients ON patients
  FOR UPDATE TO authenticated
  USING (
    created_by_professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by_professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Pro can DELETE patients they created
CREATE POLICY pro_delete_own_patients ON patients
  FOR DELETE TO authenticated
  USING (
    created_by_professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );
```

**Step 3: Apply migration for users table RLS (pro can insert patient users)**

Apply migration `add_pro_insert_patient_users_rls`:

```sql
-- Pro can insert users with role='patient'
CREATE POLICY pro_insert_patient_users ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    role = 'patient' AND (SELECT is_professional())
  );
```

**Step 4: Update `create_patient_for_pro` function to set `created_by_professional_id`**

Apply migration `update_create_patient_for_pro_v2`:

```sql
CREATE OR REPLACE FUNCTION create_patient_for_pro(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_patient_id uuid;
  v_existing_user_id uuid;
  v_existing_patient_id uuid;
  v_professional_id uuid;
BEGIN
  -- Only professionals can call this
  IF NOT (SELECT is_professional()) THEN
    RAISE EXCEPTION 'Only professionals can create patients';
  END IF;

  -- Get the calling professional's id
  SELECT id INTO v_professional_id
  FROM professionals
  WHERE user_id = auth.uid();

  IF v_professional_id IS NULL THEN
    RAISE EXCEPTION 'Professional record not found';
  END IF;

  -- Validate required fields
  IF p_first_name IS NULL OR trim(p_first_name) = '' THEN
    RAISE EXCEPTION 'first_name is required';
  END IF;
  IF p_last_name IS NULL OR trim(p_last_name) = '' THEN
    RAISE EXCEPTION 'last_name is required';
  END IF;
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'email is required';
  END IF;

  -- Check if a user with this email already exists
  SELECT id INTO v_existing_user_id FROM users WHERE email = lower(trim(p_email));

  IF v_existing_user_id IS NOT NULL THEN
    -- User exists, check if patient record exists
    SELECT id INTO v_existing_patient_id FROM patients WHERE user_id = v_existing_user_id;

    IF v_existing_patient_id IS NOT NULL THEN
      -- Patient already exists — set ownership if not set
      UPDATE patients
      SET created_by_professional_id = v_professional_id
      WHERE id = v_existing_patient_id
        AND created_by_professional_id IS NULL;

      RETURN jsonb_build_object(
        'patient_id', v_existing_patient_id,
        'user_id', v_existing_user_id,
        'already_exists', true
      );
    ELSE
      -- User exists but no patient record, create one
      INSERT INTO patients (user_id, first_name, last_name, email, phone, created_by_professional_id)
      VALUES (v_existing_user_id, trim(p_first_name), trim(p_last_name), lower(trim(p_email)), p_phone, v_professional_id)
      RETURNING id INTO v_patient_id;

      RETURN jsonb_build_object(
        'patient_id', v_patient_id,
        'user_id', v_existing_user_id,
        'already_exists', false
      );
    END IF;
  END IF;

  -- Create new user with role patient
  INSERT INTO users (email, role, first_name, last_name, phone)
  VALUES (lower(trim(p_email)), 'patient', trim(p_first_name), trim(p_last_name), p_phone)
  RETURNING id INTO v_user_id;

  -- Create patient record
  INSERT INTO patients (user_id, first_name, last_name, email, phone, created_by_professional_id)
  VALUES (v_user_id, trim(p_first_name), trim(p_last_name), lower(trim(p_email)), p_phone, v_professional_id)
  RETURNING id INTO v_patient_id;

  RETURN jsonb_build_object(
    'patient_id', v_patient_id,
    'user_id', v_user_id,
    'already_exists', false
  );
END;
$$;
```

**Step 5: Verify migration applied**

Run SQL: `SELECT column_name FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'created_by_professional_id';`
Expected: 1 row returned

**Step 6: Commit** (no local files changed, migrations are remote)

---

## Task 3: Add i18n translation keys for patients CRUD + services CRUD

**Files:**
- Modify: `src/locales/pt/professional.json`
- Modify: `src/locales/fr/professional.json`

**Step 1: Add new keys to PT translations**

In `src/locales/pt/professional.json`, add to the `"patients"` object:

```json
"addPatient": "Adicionar paciente",
"editPatient": "Editar paciente",
"deletePatient": "Eliminar paciente",
"deletePatientConfirm": "Tem a certeza que deseja eliminar este paciente? Esta ação não pode ser desfeita.",
"deletePatientWarning": "Os dados do paciente serão permanentemente removidos.",
"firstName": "Nome",
"lastName": "Apelido",
"firstNamePlaceholder": "Nome do paciente",
"lastNamePlaceholder": "Apelido do paciente",
"emailPlaceholder": "email@exemplo.com",
"phonePlaceholder": "+351 912 345 678",
"save": "Guardar",
"create": "Criar paciente",
"update": "Atualizar",
"deleting": "A eliminar...",
"creating": "A criar...",
"updating": "A atualizar...",
"patientCreated": "Paciente criado com sucesso",
"patientUpdated": "Paciente atualizado com sucesso",
"patientDeleted": "Paciente eliminado com sucesso",
"patientAlreadyExists": "Este paciente já existe na base de dados",
"errorCreating": "Erro ao criar paciente",
"errorUpdating": "Erro ao atualizar paciente",
"errorDeleting": "Erro ao eliminar paciente",
"actions": "Ações"
```

Add new top-level `"services"` object:

```json
"services": {
  "title": "Serviços",
  "description": "Gestão dos seus serviços oferecidos aos pacientes",
  "serviceList": "Serviços Oferecidos",
  "servicesFoundSingular": "serviço registado",
  "servicesFoundPlural": "serviços registados",
  "addService": "Adicionar serviço",
  "editService": "Editar serviço",
  "deleteService": "Eliminar serviço",
  "deleteServiceConfirm": "Tem a certeza que deseja eliminar este serviço?",
  "deleteServiceWarning": "Este serviço será permanentemente removido.",
  "name": "Nome",
  "namePlaceholder": "Nome do serviço",
  "descriptionField": "Descrição",
  "descriptionPlaceholder": "Descrição do serviço (opcional)",
  "duration": "Duração (min)",
  "durationPlaceholder": "30",
  "active": "Ativo",
  "inactive": "Inativo",
  "status": "Estado",
  "type": "Tipo",
  "noServices": "Sem serviços",
  "noServicesDescription": "Adicione os seus serviços para que os pacientes possam agendar.",
  "save": "Guardar",
  "create": "Criar serviço",
  "update": "Atualizar",
  "deleting": "A eliminar...",
  "creating": "A criar...",
  "updating": "A atualizar...",
  "serviceCreated": "Serviço criado com sucesso",
  "serviceUpdated": "Serviço atualizado com sucesso",
  "serviceDeleted": "Serviço eliminado com sucesso",
  "errorCreating": "Erro ao criar serviço",
  "errorUpdating": "Erro ao atualizar serviço",
  "errorDeleting": "Erro ao eliminar serviço",
  "actions": "Ações",
  "consultationType": {
    "in-person": "Presencial"
  }
}
```

**Step 2: Add corresponding FR translations**

In `src/locales/fr/professional.json`, add to `"patients"`:

```json
"addPatient": "Ajouter patient",
"editPatient": "Modifier patient",
"deletePatient": "Supprimer patient",
"deletePatientConfirm": "Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.",
"deletePatientWarning": "Les données du patient seront définitivement supprimées.",
"firstName": "Prénom",
"lastName": "Nom",
"firstNamePlaceholder": "Prénom du patient",
"lastNamePlaceholder": "Nom du patient",
"emailPlaceholder": "email@exemple.com",
"phonePlaceholder": "+33 6 12 34 56 78",
"save": "Enregistrer",
"create": "Créer patient",
"update": "Mettre à jour",
"deleting": "Suppression...",
"creating": "Création...",
"updating": "Mise à jour...",
"patientCreated": "Patient créé avec succès",
"patientUpdated": "Patient mis à jour avec succès",
"patientDeleted": "Patient supprimé avec succès",
"patientAlreadyExists": "Ce patient existe déjà dans la base de données",
"errorCreating": "Erreur lors de la création du patient",
"errorUpdating": "Erreur lors de la mise à jour du patient",
"errorDeleting": "Erreur lors de la suppression du patient",
"actions": "Actions"
```

Add FR `"services"` object with matching shape (French translations).

**Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit --pretty`
Expected: No errors (FR shape must match PT shape exactly)

**Step 4: Commit**

```bash
git add src/locales/pt/professional.json src/locales/fr/professional.json
git commit -m "feat(i18n): add translation keys for patients and services CRUD"
```

---

## Task 4: Create patient server actions

**Files:**
- Create: `src/app/(professional)/_actions/patients.ts`

**Step 1: Create the server actions file**

Create `src/app/(professional)/_actions/patients.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult =
  | { success: true; data?: Record<string, unknown> }
  | { success: false; error: string };

export async function createPatient(formData: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase.rpc("create_patient_for_pro", {
    p_first_name: formData.first_name.trim(),
    p_last_name: formData.last_name.trim(),
    p_email: formData.email.trim(),
    p_phone: formData.phone?.trim() || null,
  });

  if (error) return { success: false, error: error.message };

  const result = data as { patient_id: string; user_id: string; already_exists: boolean };

  revalidatePath("/pro/patients");
  return {
    success: true,
    data: {
      patient_id: result.patient_id,
      already_exists: result.already_exists,
    },
  };
}

export async function updatePatient(
  patientId: string,
  formData: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("patients")
    .update({
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email?.trim() || null,
      phone: formData.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientId);

  if (error) return { success: false, error: error.message };

  // Also update the users table to keep names in sync
  const { data: patient } = await supabase
    .from("patients")
    .select("user_id")
    .eq("id", patientId)
    .single();

  if (patient) {
    await supabase
      .from("users")
      .update({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone?.trim() || null,
      })
      .eq("id", patient.user_id);
  }

  revalidatePath("/pro/patients");
  return { success: true };
}

export async function deletePatient(patientId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check if patient has appointments (prevent deletion if so)
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId);

  if (count && count > 0) {
    return {
      success: false,
      error: "Cannot delete patient with existing appointments",
    };
  }

  // Get user_id before deleting patient
  const { data: patient } = await supabase
    .from("patients")
    .select("user_id")
    .eq("id", patientId)
    .single();

  if (!patient) return { success: false, error: "Patient not found" };

  // Delete patient record
  const { error } = await supabase.from("patients").delete().eq("id", patientId);
  if (error) return { success: false, error: error.message };

  // Delete orphaned user record (only if role is patient and no other patient record)
  const { count: otherPatients } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .eq("user_id", patient.user_id);

  if (!otherPatients || otherPatients === 0) {
    await supabase.from("users").delete().eq("id", patient.user_id).eq("role", "patient");
  }

  revalidatePath("/pro/patients");
  return { success: true };
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/_actions/patients.ts
git commit -m "feat(patients): add server actions for create, update, delete"
```

---

## Task 5: Create service server actions

**Files:**
- Create: `src/app/(professional)/_actions/services.ts`

**Step 1: Create the server actions file**

Create `src/app/(professional)/_actions/services.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult =
  | { success: true; data?: Record<string, unknown> }
  | { success: false; error: string };

export async function createService(formData: {
  name: string;
  description?: string;
  duration_minutes: number;
  is_active: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) return { success: false, error: "Professional not found" };

  const { error } = await supabase.from("services").insert({
    name: formData.name.trim(),
    description: formData.description?.trim() || null,
    duration_minutes: formData.duration_minutes,
    is_active: formData.is_active,
    price: 0,
    consultation_type: "in-person",
    professional_id: professional.id,
    professional_user_id: user.id,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/pro/services");
  return { success: true };
}

export async function updateService(
  serviceId: string,
  formData: {
    name: string;
    description?: string;
    duration_minutes: number;
    is_active: boolean;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("services")
    .update({
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      duration_minutes: formData.duration_minutes,
      is_active: formData.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId)
    .eq("professional_user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/pro/services");
  return { success: true };
}

export async function deleteService(serviceId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check if service is used in appointments
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);

  if (count && count > 0) {
    return {
      success: false,
      error: "Cannot delete service with existing appointments. Deactivate it instead.",
    };
  }

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("professional_user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/pro/services");
  return { success: true };
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/_actions/services.ts
git commit -m "feat(services): add server actions for create, update, delete"
```

---

## Task 6: Create patient CRUD dialog components

**Files:**
- Create: `src/app/(professional)/pro/patients/_components/create-patient-dialog.tsx`
- Create: `src/app/(professional)/pro/patients/_components/edit-patient-dialog.tsx`
- Create: `src/app/(professional)/pro/patients/_components/delete-patient-dialog.tsx`

**Step 1: Create CreatePatientDialog**

Create `src/app/(professional)/pro/patients/_components/create-patient-dialog.tsx`:

This is a `"use client"` component that:
- Uses a shadcn `Dialog` with a form inside
- Fields: first_name (required), last_name (required), email (required — needed by `create_patient_for_pro`), phone (optional)
- Validates with zod: first_name min 2, last_name min 2, email valid format, phone optional
- Uses `react-hook-form` with `zodResolver`
- Calls `createPatient` server action on submit
- Shows toast on success/error via `sonner`
- Closes dialog on success
- Uses i18n via `useProfessionalI18n()`

**Step 2: Create EditPatientDialog**

Create `src/app/(professional)/pro/patients/_components/edit-patient-dialog.tsx`:

Same pattern, pre-filled with existing patient data. Calls `updatePatient`.

**Step 3: Create DeletePatientDialog**

Create `src/app/(professional)/pro/patients/_components/delete-patient-dialog.tsx`:

Uses shadcn `AlertDialog`. Calls `deletePatient`. Shows warning about permanent deletion.

**Step 4: Commit**

```bash
git add src/app/(professional)/pro/patients/_components/
git commit -m "feat(patients): add create, edit, delete dialog components"
```

---

## Task 7: Refactor patients page — server page + client table

**Files:**
- Modify: `src/app/(professional)/pro/patients/page.tsx`
- Create: `src/app/(professional)/pro/patients/_components/patients-table.tsx`

**Step 1: Create PatientsTable client component**

Create `src/app/(professional)/pro/patients/_components/patients-table.tsx`:

This `"use client"` component:
- Receives patients array as prop
- Renders the existing table markup
- Adds an "Actions" column with a `DropdownMenu` (Edit / Delete)
- Integrates CreatePatientDialog (triggered by button in page header), EditPatientDialog, DeletePatientDialog
- Handles client-side search filtering
- Uses `useProfessionalI18n()` for translations

**Step 2: Refactor page.tsx to be a slim server component**

Modify `src/app/(professional)/pro/patients/page.tsx`:
- Keep auth check and data fetching (but change query to also fetch `created_by_professional_id` patients, not just via appointments)
- Query: fetch patients where `created_by_professional_id` = professional.id OR patient appears in pro's appointments
- Pass data to `<PatientsTable patients={patients} />`
- PageHeader gets an `action` prop with the "Add Patient" button trigger

**Step 3: Commit**

```bash
git add src/app/(professional)/pro/patients/
git commit -m "feat(patients): refactor page with client table and CRUD dialogs"
```

---

## Task 8: Create service CRUD dialog components

**Files:**
- Create: `src/app/(professional)/pro/services/_components/create-service-dialog.tsx`
- Create: `src/app/(professional)/pro/services/_components/edit-service-dialog.tsx`
- Create: `src/app/(professional)/pro/services/_components/delete-service-dialog.tsx`

**Step 1: Create CreateServiceDialog**

Create `src/app/(professional)/pro/services/_components/create-service-dialog.tsx`:

`"use client"` component:
- Dialog with form: name (required), description (optional textarea), duration_minutes (number input, required), is_active (Switch, default true)
- Zod: name min 2 max 100, description max 500, duration_minutes int > 0 and <= 480, is_active boolean
- Calls `createService` server action
- Toast feedback

**Step 2: Create EditServiceDialog**

Same pattern, pre-filled. Calls `updateService`.

**Step 3: Create DeleteServiceDialog**

AlertDialog pattern. Calls `deleteService`. Shows warning about appointments check.

**Step 4: Commit**

```bash
git add src/app/(professional)/pro/services/_components/
git commit -m "feat(services): add create, edit, delete dialog components"
```

---

## Task 9: Refactor services page — server page + client table

**Files:**
- Modify: `src/app/(professional)/pro/services/page.tsx`
- Create: `src/app/(professional)/pro/services/_components/services-table.tsx`

**Step 1: Create ServicesTable client component**

Create `src/app/(professional)/pro/services/_components/services-table.tsx`:

`"use client"` component:
- Receives services array as prop
- Renders existing table (name, description, duration, status)
- Adds "Actions" column with DropdownMenu (Edit / Delete)
- Integrates all three dialogs
- Uses `useProfessionalI18n()`

**Step 2: Refactor page.tsx**

Modify `src/app/(professional)/pro/services/page.tsx`:
- Keep auth + data fetch
- Pass to `<ServicesTable services={allServices} />`
- PageHeader gets `action` prop with "Add Service" button

**Step 3: Commit**

```bash
git add src/app/(professional)/pro/services/
git commit -m "feat(services): refactor page with client table and CRUD dialogs"
```

---

## Task 10: Regenerate Supabase TypeScript types

**Files:**
- Modify: `src/lib/supabase/types.ts`

**Step 1: Generate updated types**

Use `generate_typescript_types` for project `yblqdjhnnyfjxjluhslm` and overwrite `src/lib/supabase/types.ts`.

This will include the new `created_by_professional_id` column on the `patients` table.

**Step 2: Verify build**

Run: `npx tsc --noEmit --pretty`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "chore: regenerate supabase types after patients schema change"
```

---

## Task 11: Verify end-to-end + run advisors

**Step 1: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run Supabase security advisors**

Check for missing RLS or security issues after migrations.

**Step 3: Manual test checklist**

- [ ] Create patient as pro
- [ ] Edit patient as pro
- [ ] Delete patient as pro (no appointments)
- [ ] Attempt to delete patient with appointments (should fail gracefully)
- [ ] Create service as pro
- [ ] Edit service as pro
- [ ] Delete service as pro (no appointments)
- [ ] Attempt to delete service with appointments (should fail gracefully)
- [ ] Pro cannot see other pro's patients
- [ ] Pro cannot see other pro's services
- [ ] Admin sees everything
