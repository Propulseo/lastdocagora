# Reminder Templates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the `message_templates` table with global template support, seed premium reminder templates, and build a full CRUD UI in the PRO "Modèles" tab.

**Architecture:** Enrich existing `message_templates` table (add `is_global`, `timing_key`, make `professional_id`/`professional_user_id` nullable for globals). Update RLS for global visibility. Build 3 new frontend components (`TemplatesTab`, `TemplateCard`, `TemplateFormDialog`) replacing the current read-only table. Use the existing optimistic-update pattern from `RemindersClient`.

**Tech Stack:** Supabase (PostgreSQL + RLS), Next.js App Router, React 19, shadcn/ui, Tailwind CSS v4, Lucide icons, Sonner toasts, date-fns, i18n (PT/FR)

---

## Task 1: Database Migration — Schema Changes

**Context:** The `message_templates` table exists with `professional_id` NOT NULL, channel check `('sms','email')`, type check `('appointment_confirmation','appointment_reminder','custom')`. No `updated_at` trigger exists. Table has 0 rows.

**Apply via Supabase MCP `apply_migration`:**

```sql
-- 1) Add new columns
ALTER TABLE message_templates
  ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timing_key text;

-- 2) Make professional_id and professional_user_id nullable (for global templates)
ALTER TABLE message_templates
  ALTER COLUMN professional_id DROP NOT NULL,
  ALTER COLUMN professional_user_id DROP NOT NULL;

-- 3) Add check constraint on timing_key
ALTER TABLE message_templates
  ADD CONSTRAINT message_templates_timing_key_check
  CHECK (timing_key IS NULL OR timing_key IN ('j-2','j-1','h-24','h-2','h-1','apres'));

-- 4) Update channel check to include 'whatsapp'
ALTER TABLE message_templates DROP CONSTRAINT message_templates_channel_check;
ALTER TABLE message_templates
  ADD CONSTRAINT message_templates_channel_check
  CHECK (channel::text = ANY(ARRAY['sms','email','whatsapp']));

-- 5) Add new indexes
CREATE INDEX IF NOT EXISTS idx_templates_global_active
  ON message_templates (is_global, is_active) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_templates_timing
  ON message_templates (timing_key) WHERE timing_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_pro_active
  ON message_templates (professional_user_id, is_active)
  WHERE professional_user_id IS NOT NULL;

-- 6) Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7) Attach trigger to message_templates
DROP TRIGGER IF EXISTS set_updated_at ON message_templates;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Migration name:** `add_global_templates_support`

**Verify:** Run `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='message_templates' ORDER BY ordinal_position;` — confirm `is_global`, `timing_key` exist and `professional_id` is nullable.

---

## Task 2: Database Migration — RLS Policies

**Context:** Current RLS policies use `professional_user_id = auth.uid() OR is_admin()`. Need to add `is_global = true` to SELECT, and block INSERT/UPDATE/DELETE on global templates.

**Apply via Supabase MCP `apply_migration`:**

```sql
-- Drop existing policies
DROP POLICY IF EXISTS pro_or_admin_select ON message_templates;
DROP POLICY IF EXISTS pro_insert ON message_templates;
DROP POLICY IF EXISTS pro_or_admin_update ON message_templates;
DROP POLICY IF EXISTS pro_or_admin_delete ON message_templates;

-- SELECT: own templates OR global templates OR admin
CREATE POLICY "select_own_or_global"
  ON message_templates FOR SELECT TO authenticated
  USING (
    professional_user_id = auth.uid()
    OR is_global = true
    OR is_admin()
  );

-- INSERT: only own non-global templates
CREATE POLICY "insert_own_only"
  ON message_templates FOR INSERT TO authenticated
  WITH CHECK (
    professional_user_id = auth.uid()
    AND is_global = false
  );

-- UPDATE: only own non-global templates (or admin)
CREATE POLICY "update_own_only"
  ON message_templates FOR UPDATE TO authenticated
  USING (
    (professional_user_id = auth.uid() AND is_global = false)
    OR is_admin()
  )
  WITH CHECK (
    (professional_user_id = auth.uid() AND is_global = false)
    OR is_admin()
  );

-- DELETE: only own non-global templates (or admin)
CREATE POLICY "delete_own_only"
  ON message_templates FOR DELETE TO authenticated
  USING (
    (professional_user_id = auth.uid() AND is_global = false)
    OR is_admin()
  );
```

**Migration name:** `update_templates_rls_for_globals`

**Verify:** Run `SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename='message_templates';` — confirm 4 policies with global support.

---

## Task 3: Database Migration — Seed Global Templates

**Context:** Insert 10 premium global templates (is_global=true, professional_id=NULL) with variables. French text (this is a PT/FR app but templates are written in language of use — FR for the seed since timing_key labels are FR).

**Apply via Supabase MCP `apply_migration`:**

```sql
INSERT INTO message_templates (professional_id, professional_user_id, name, type, channel, timing_key, subject, content, is_active, is_default, is_global)
VALUES
-- 1) SMS J-1 Confirmation
(NULL, NULL,
 'Confirmação J-1 (SMS)',
 'appointment_reminder', 'sms', 'j-1', NULL,
 'Olá {patient_prenom}! Lembramos da sua consulta amanhã às {heure} com {pro_nom}. Confirme respondendo SIM ou cancele em {lien_annulation}. Até amanhã!',
 true, true, true),

-- 2) SMS H-2 Rappel court
(NULL, NULL,
 'Lembrete H-2 (SMS)',
 'appointment_reminder', 'sms', 'h-2', NULL,
 '{patient_prenom}, a sua consulta com {pro_nom} é daqui a 2 horas ({heure}). Endereço: {adresse}. Até já!',
 true, true, true),

-- 3) SMS Après RDV (merci + avis)
(NULL, NULL,
 'Pós-consulta (SMS)',
 'custom', 'sms', 'apres', NULL,
 'Olá {patient_prenom}! Obrigado pela sua visita ao consultório de {pro_nom}. A sua opinião é importante para nós. Esperamos vê-lo em breve!',
 true, true, true),

-- 4) EMAIL J-2 avec sujet + contenu
(NULL, NULL,
 'Lembrete J-2 (Email)',
 'appointment_reminder', 'email', 'j-2',
 'Lembrete: a sua consulta em {date}',
 'Olá {patient_prenom} {patient_nom},

Lembramos que tem uma consulta marcada:

📅 Data: {date}
🕐 Hora: {heure}
📍 Local: {adresse}
👨‍⚕️ Profissional: {pro_nom}

Para confirmar a sua presença, clique aqui: {lien_confirmation}
Para cancelar ou reagendar: {lien_annulation}

Em caso de dúvida, contacte-nos: {tel_cabinet}

Com os melhores cumprimentos,
Equipa {pro_nom}',
 true, true, true),

-- 5) EMAIL H-24 + consignes
(NULL, NULL,
 'Lembrete H-24 com instruções (Email)',
 'appointment_reminder', 'email', 'h-24',
 'Amanhã: a sua consulta com {pro_nom}',
 'Olá {patient_prenom},

A sua consulta é amanhã:

📅 {date} às {heure}
📍 {adresse}

📋 Instruções importantes:
• Chegue 10 minutos antes da hora marcada
• Traga o seu cartão de saúde e documentos relevantes
• Em caso de impedimento, avise-nos com antecedência

Confirme aqui: {lien_confirmation}
Precisa reagendar? {lien_annulation}

Até amanhã!
Equipa {pro_nom}',
 true, true, true),

-- 6) WhatsApp J-1 convivial
(NULL, NULL,
 'Lembrete J-1 (WhatsApp)',
 'appointment_reminder', 'whatsapp', 'j-1', NULL,
 'Olá {patient_prenom} 👋

Lembrete amigável: tem consulta amanhã às {heure} com {pro_nom}.

📍 {adresse}

Tudo confirmado? Responda ✅ para confirmar ou contacte-nos para reagendar: {tel_cabinet}

Até amanhã! 😊',
 true, true, true),

-- 7) SMS No-show bienveillant
(NULL, NULL,
 'Falta à consulta (SMS)',
 'custom', 'sms', 'apres', NULL,
 'Olá {patient_prenom}, notámos que não compareceu à consulta de {date} às {heure}. Esperamos que esteja bem! Gostaríamos de reagendar. Contacte-nos: {tel_cabinet}',
 true, true, true),

-- 8) EMAIL Replanification
(NULL, NULL,
 'Reagendamento (Email)',
 'custom', 'email', 'apres',
 'Reagendar a sua consulta — {pro_nom}',
 'Olá {patient_prenom} {patient_nom},

Gostaríamos de propor-lhe um novo horário para a sua consulta com {pro_nom}.

A sua saúde é importante para nós, e queremos garantir o melhor acompanhamento possível.

Para escolher uma nova data, visite: {lien_confirmation}

Em caso de dúvida: {tel_cabinet}

Com os melhores cumprimentos,
Equipa {pro_nom}',
 true, true, true),

-- 9) SMS H-1 último lembrete
(NULL, NULL,
 'Último lembrete H-1 (SMS)',
 'appointment_reminder', 'sms', 'h-1', NULL,
 '{patient_prenom}, a sua consulta com {pro_nom} é daqui a 1 hora ({heure}). Endereço: {adresse}. Até já!',
 true, true, true),

-- 10) WhatsApp pós-consulta
(NULL, NULL,
 'Pós-consulta (WhatsApp)',
 'custom', 'whatsapp', 'apres', NULL,
 'Olá {patient_prenom} 😊

Obrigado pela sua visita de hoje com {pro_nom}!

A sua opinião é muito importante para nós. Se tiver alguma questão após a consulta, não hesite em contactar: {tel_cabinet}

Cuide-se! 💚',
 true, true, true);
```

**Migration name:** `seed_global_reminder_templates`

**Verify:** Run `SELECT name, channel, timing_key, is_global FROM message_templates WHERE is_global = true ORDER BY channel, timing_key;` — should return 10 rows.

---

## Task 4: Database — Duplication Function

**Context:** When a pro wants to customize a global template, they duplicate it. Also useful as a bulk action at first login.

**Apply via Supabase MCP `apply_migration`:**

```sql
-- Function to duplicate global templates for a specific professional
CREATE OR REPLACE FUNCTION duplicate_global_templates_for_pro(
  p_professional_id uuid,
  p_professional_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duplicated_count integer;
BEGIN
  INSERT INTO message_templates (
    professional_id, professional_user_id, name, type, channel,
    timing_key, subject, content, is_active, is_default, is_global
  )
  SELECT
    p_professional_id, p_professional_user_id, name, type, channel,
    timing_key, subject, content, true, false, false
  FROM message_templates
  WHERE is_global = true AND is_active = true;

  GET DIAGNOSTICS duplicated_count = ROW_COUNT;
  RETURN duplicated_count;
END;
$$;
```

**Migration name:** `add_duplicate_global_templates_function`

**Verify:** Function exists: `SELECT proname FROM pg_proc WHERE proname = 'duplicate_global_templates_for_pro';`

---

## Task 5: Regenerate Supabase Types

**Run:** `npx supabase gen types typescript --project-id yblqdjhnnyfjxjluhslm > src/lib/supabase/types.ts`

Or use the MCP `generate_typescript_types` tool and overwrite `src/lib/supabase/types.ts`.

**Verify:** The `message_templates` Row type in `src/lib/supabase/types.ts` includes:
- `is_global: boolean`
- `timing_key: string | null`
- `professional_id: string | null` (was `string`)
- `professional_user_id: string | null` (was `string`)

**Commit:** `chore: regenerate supabase types after message_templates schema changes`

---

## Task 6: Update i18n — PT & FR Translations

**Files:**
- Modify: `src/locales/pt/professional.json` lines 301-324 (reminders.templates section)
- Modify: `src/locales/fr/professional.json` lines 301-324 (reminders.templates section)

**Replace the entire `reminders.templates` object** in both files with expanded translations:

**PT (`src/locales/pt/professional.json`)** — replace lines 301-324:
```json
"templates": {
  "title": "Modelos de lembretes",
  "subtitle": "Gerencie os seus modelos de mensagem (SMS, Email, WhatsApp).",
  "newTemplate": "Novo modelo",
  "name": "Nome",
  "type": "Tipo",
  "channel": "Canal",
  "content": "Conteúdo",
  "subject": "Assunto",
  "body": "Mensagem",
  "status": "Estado",
  "active": "Ativo",
  "inactive": "Inativo",
  "default": "Padrão",
  "global": "Global",
  "mine": "Meu",
  "timing": "Momento de envio",
  "search": "Pesquisar modelos...",
  "filterChannel": "Canal",
  "filterTiming": "Momento",
  "allChannels": "Todos os canais",
  "allTimings": "Todos os momentos",
  "activeOnly": "Apenas ativos",
  "preview": "Pré-visualização",
  "variables": "Variáveis disponíveis",
  "variableHint": "Clique para inserir",
  "smsCounter": "{{count}} / 160 caracteres",
  "smsWarning": "O SMS excede 160 caracteres e poderá ser dividido.",
  "duplicate": "Duplicar",
  "edit": "Editar",
  "delete": "Eliminar",
  "deleteConfirm": "Tem a certeza que deseja eliminar este modelo?",
  "deleteDescription": "Esta ação é irreversível.",
  "duplicateSuccess": "Modelo duplicado. Pode agora editá-lo.",
  "toggledActive": "Modelo ativado",
  "toggledInactive": "Modelo desativado",
  "empty": {
    "title": "Sem modelos",
    "description": "Crie o seu primeiro modelo de mensagem ou duplique um dos modelos globais."
  },
  "dialog": {
    "newTitle": "Novo modelo",
    "editTitle": "Editar modelo",
    "save": "Guardar",
    "create": "Criar modelo",
    "namePlaceholder": "Ex: Lembrete SMS 24h",
    "subjectPlaceholder": "Assunto do email",
    "bodyPlaceholder": "Escreva a sua mensagem aqui. Use as variáveis disponíveis à direita.",
    "channelSms": "SMS",
    "channelEmail": "Email",
    "channelWhatsapp": "WhatsApp"
  },
  "timingLabels": {
    "j-2": "J-2 (2 dias antes)",
    "j-1": "J-1 (1 dia antes)",
    "h-24": "H-24 (24 horas antes)",
    "h-2": "H-2 (2 horas antes)",
    "h-1": "H-1 (1 hora antes)",
    "apres": "Após consulta"
  }
}
```

**FR (`src/locales/fr/professional.json`)** — replace lines 301-324:
```json
"templates": {
  "title": "Modèles de rappels",
  "subtitle": "Gérez vos modèles de messages (SMS, Email, WhatsApp).",
  "newTemplate": "Nouveau modèle",
  "name": "Nom",
  "type": "Type",
  "channel": "Canal",
  "content": "Contenu",
  "subject": "Objet",
  "body": "Message",
  "status": "Statut",
  "active": "Actif",
  "inactive": "Inactif",
  "default": "Par défaut",
  "global": "Global",
  "mine": "Mon modèle",
  "timing": "Moment d'envoi",
  "search": "Rechercher des modèles...",
  "filterChannel": "Canal",
  "filterTiming": "Moment",
  "allChannels": "Tous les canaux",
  "allTimings": "Tous les moments",
  "activeOnly": "Actifs uniquement",
  "preview": "Aperçu",
  "variables": "Variables disponibles",
  "variableHint": "Cliquez pour insérer",
  "smsCounter": "{{count}} / 160 caractères",
  "smsWarning": "Le SMS dépasse 160 caractères et pourra être scindé.",
  "duplicate": "Dupliquer",
  "edit": "Modifier",
  "delete": "Supprimer",
  "deleteConfirm": "Êtes-vous sûr de vouloir supprimer ce modèle ?",
  "deleteDescription": "Cette action est irréversible.",
  "duplicateSuccess": "Modèle dupliqué. Vous pouvez maintenant le modifier.",
  "toggledActive": "Modèle activé",
  "toggledInactive": "Modèle désactivé",
  "empty": {
    "title": "Aucun modèle",
    "description": "Créez votre premier modèle de message ou dupliquez un modèle global."
  },
  "dialog": {
    "newTitle": "Nouveau modèle",
    "editTitle": "Modifier le modèle",
    "save": "Enregistrer",
    "create": "Créer le modèle",
    "namePlaceholder": "Ex: Rappel SMS 24h",
    "subjectPlaceholder": "Objet de l'email",
    "bodyPlaceholder": "Rédigez votre message ici. Utilisez les variables disponibles à droite.",
    "channelSms": "SMS",
    "channelEmail": "Email",
    "channelWhatsapp": "WhatsApp"
  },
  "timingLabels": {
    "j-2": "J-2 (2 jours avant)",
    "j-1": "J-1 (1 jour avant)",
    "h-24": "H-24 (24 heures avant)",
    "h-2": "H-2 (2 heures avant)",
    "h-1": "H-1 (1 heure avant)",
    "apres": "Après rendez-vous"
  }
}
```

Also add `"whatsapp": "WhatsApp"` to `reminders.channel` in both files (currently only `email` and `sms`).

**Commit:** `feat(i18n): add reminder template translations (PT/FR)`

---

## Task 7: Update Server Page — Fetch Global + Pro Templates

**File:** Modify `src/app/(professional)/pro/reminders/page.tsx` lines 47-51

**Change the templates query from:**
```typescript
supabase
  .from("message_templates")
  .select("*")
  .eq("professional_id", professional.id)
  .order("created_at", { ascending: false }),
```

**To:**
```typescript
supabase
  .from("message_templates")
  .select("*")
  .or(`professional_id.eq.${professional.id},is_global.eq.true`)
  .order("is_global", { ascending: true })
  .order("created_at", { ascending: false }),
```

This fetches pro templates first, then globals, sorted by date within each group.

**Commit:** `feat(reminders): fetch global + pro templates in server page`

---

## Task 8: Create TemplateCard Component

**File:** Create `src/app/(professional)/pro/reminders/_components/TemplateCard.tsx`

This component renders a single template as a card with:
- Name, channel badge, timing badge, global/mine badge
- Content preview (2 lines truncated)
- Toggle active/inactive switch
- Action buttons: Edit/Duplicate/Delete (duplicate-only for globals)

```typescript
"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Mail,
  MessageSquare,
  Smartphone,
  MoreVertical,
  Copy,
  Pencil,
  Trash2,
  Globe,
  User,
} from "lucide-react";
import type { Tables } from "@/lib/supabase/types";

type MessageTemplate = Tables<"message_templates">;

const CHANNEL_CONFIG = {
  sms: { icon: Smartphone, color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  email: { icon: Mail, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  whatsapp: { icon: MessageSquare, color: "bg-green-500/10 text-green-600 border-green-200" },
} as const;

interface TemplateCardProps {
  template: MessageTemplate;
  professionalId: string;
  professionalUserId: string;
  onEdit: (template: MessageTemplate) => void;
  onDuplicated: (template: MessageTemplate) => void;
  onDeleted: (templateId: string) => void;
  onToggled: (templateId: string, isActive: boolean) => void;
}

export function TemplateCard({
  template,
  professionalId,
  professionalUserId,
  onEdit,
  onDuplicated,
  onDeleted,
  onToggled,
}: TemplateCardProps) {
  const { t } = useProfessionalI18n();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isGlobal = template.is_global;
  const isOwn = template.professional_user_id === professionalUserId;
  const channelCfg = CHANNEL_CONFIG[template.channel as keyof typeof CHANNEL_CONFIG] ?? CHANNEL_CONFIG.sms;
  const ChannelIcon = channelCfg.icon;

  const timingLabel = template.timing_key
    ? t.reminders.templates.timingLabels[template.timing_key as keyof typeof t.reminders.templates.timingLabels] ?? template.timing_key
    : null;

  const handleDuplicate = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("message_templates")
      .insert({
        professional_id: professionalId,
        professional_user_id: professionalUserId,
        name: `${template.name} (cópia)`,
        type: template.type,
        channel: template.channel,
        timing_key: template.timing_key,
        subject: template.subject,
        content: template.content,
        is_active: true,
        is_default: false,
        is_global: false,
      })
      .select("*")
      .single();

    if (error) {
      toast.error(t.reminders.toast.error);
    } else {
      toast.success(t.reminders.templates.duplicateSuccess);
      onDuplicated(data);
    }
  }, [template, professionalId, professionalUserId, t, onDuplicated]);

  const handleDelete = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("message_templates")
      .delete()
      .eq("id", template.id);

    if (error) {
      toast.error(t.reminders.toast.error);
    } else {
      onDeleted(template.id);
    }
    setDeleteDialogOpen(false);
  }, [template.id, t, onDeleted]);

  return (
    <>
      <Card className={cn(
        "group transition-all hover:shadow-md",
        !template.is_active && "opacity-60",
      )}>
        <CardContent className="p-4 space-y-3">
          {/* Header row: name + actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate">{template.name}</h3>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Switch
                checked={template.is_active}
                onCheckedChange={(checked) => onToggled(template.id, checked)}
                className="scale-90"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="mr-2 size-4" />
                    {t.reminders.templates.duplicate}
                  </DropdownMenuItem>
                  {isOwn && !isGlobal && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit(template)}>
                        <Pencil className="mr-2 size-4" />
                        {t.reminders.templates.edit}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        {t.reminders.templates.delete}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className={cn("gap-1 text-xs", channelCfg.color)}>
              <ChannelIcon className="size-3" />
              {template.channel.toUpperCase()}
            </Badge>
            {timingLabel && (
              <Badge variant="outline" className="text-xs">
                {timingLabel}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn("gap-1 text-xs", isGlobal
                ? "bg-amber-500/10 text-amber-600 border-amber-200"
                : "bg-violet-500/10 text-violet-600 border-violet-200"
              )}
            >
              {isGlobal ? <Globe className="size-3" /> : <User className="size-3" />}
              {isGlobal ? t.reminders.templates.global : t.reminders.templates.mine}
            </Badge>
          </div>

          {/* Content preview */}
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
            {template.content}
          </p>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.reminders.templates.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.reminders.templates.deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.reminders.templates.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

**Ensure shadcn components exist:** `dropdown-menu`, `alert-dialog`. If not, install:
```bash
npx shadcn@latest add dropdown-menu alert-dialog
```

**Commit:** `feat(templates): add TemplateCard component`

---

## Task 9: Create TemplateFormDialog Component

**File:** Create `src/app/(professional)/pro/reminders/_components/TemplateFormDialog.tsx`

Full modal with: name, channel, timing, subject (email only), body textarea with SMS counter, clickable variable sidebar, live preview panel.

```typescript
"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Code2 } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";

type MessageTemplate = Tables<"message_templates">;

const TEMPLATE_VARIABLES = [
  { key: "{patient_prenom}", label: "Prénom patient", example: "Maria" },
  { key: "{patient_nom}", label: "Nom patient", example: "Silva" },
  { key: "{date}", label: "Date RDV", example: "25/02/2026" },
  { key: "{heure}", label: "Heure RDV", example: "14:30" },
  { key: "{adresse}", label: "Adresse cabinet", example: "Rua das Flores 123, Lisboa" },
  { key: "{pro_nom}", label: "Nom professionnel", example: "Dr. Santos" },
  { key: "{lien_annulation}", label: "Lien annulation", example: "https://..." },
  { key: "{lien_confirmation}", label: "Lien confirmation", example: "https://..." },
  { key: "{tel_cabinet}", label: "Téléphone cabinet", example: "+351 21 000 0000" },
] as const;

const CHANNELS = ["sms", "email", "whatsapp"] as const;
const TIMING_KEYS = ["j-2", "j-1", "h-24", "h-2", "h-1", "apres"] as const;

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalUserId: string;
  editTemplate?: MessageTemplate | null;
  onSaved: (template: MessageTemplate) => void;
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  professionalId,
  professionalUserId,
  editTemplate,
  onSaved,
}: TemplateFormDialogProps) {
  const formKey = `${editTemplate?.id ?? "new"}-${String(open)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <TemplateForm
          key={formKey}
          professionalId={professionalId}
          professionalUserId={professionalUserId}
          editTemplate={editTemplate}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      )}
    </Dialog>
  );
}

function TemplateForm({
  professionalId,
  professionalUserId,
  editTemplate,
  onOpenChange,
  onSaved,
}: Omit<TemplateFormDialogProps, "open">) {
  const { t } = useProfessionalI18n();

  const [name, setName] = useState(editTemplate?.name ?? "");
  const [channel, setChannel] = useState(editTemplate?.channel ?? "sms");
  const [timingKey, setTimingKey] = useState(editTemplate?.timing_key ?? "j-1");
  const [subject, setSubject] = useState(editTemplate?.subject ?? "");
  const [body, setBody] = useState(editTemplate?.content ?? "");
  const [saving, setSaving] = useState(false);

  const isEmail = channel === "email";
  const isSms = channel === "sms";
  const smsLength = body.length;
  const smsOverLimit = isSms && smsLength > 160;

  // Replace variables with example values for preview
  const previewBody = useMemo(() => {
    let text = body;
    for (const v of TEMPLATE_VARIABLES) {
      text = text.replaceAll(v.key, v.example);
    }
    return text;
  }, [body]);

  const previewSubject = useMemo(() => {
    let text = subject;
    for (const v of TEMPLATE_VARIABLES) {
      text = text.replaceAll(v.key, v.example);
    }
    return text;
  }, [subject]);

  const insertVariable = useCallback((varKey: string) => {
    setBody((prev) => prev + varKey);
  }, []);

  const canSave = name.trim() && body.trim() && (!isEmail || subject.trim());

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    const supabase = createClient();
    const payload = {
      professional_id: professionalId,
      professional_user_id: professionalUserId,
      name: name.trim(),
      type: "custom" as const,
      channel,
      timing_key: timingKey,
      subject: isEmail ? subject.trim() : null,
      content: body.trim(),
      is_active: editTemplate?.is_active ?? true,
      is_default: false,
      is_global: false,
    };

    if (editTemplate) {
      const { data, error } = await supabase
        .from("message_templates")
        .update(payload)
        .eq("id", editTemplate.id)
        .select("*")
        .single();

      if (error) {
        toast.error(t.reminders.toast.error);
      } else {
        toast.success(t.reminders.toast.templateUpdated);
        onSaved(data);
        onOpenChange(false);
      }
    } else {
      const { data, error } = await supabase
        .from("message_templates")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        toast.error(t.reminders.toast.error);
      } else {
        toast.success(t.reminders.toast.templateCreated);
        onSaved(data);
        onOpenChange(false);
      }
    }
    setSaving(false);
  };

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editTemplate
            ? t.reminders.templates.dialog.editTitle
            : t.reminders.templates.dialog.newTitle}
        </DialogTitle>
        <DialogDescription>
          {editTemplate
            ? t.reminders.templates.dialog.editTitle
            : t.reminders.templates.dialog.newTitle}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Name */}
        <div className="grid gap-2">
          <Label>{t.reminders.templates.name}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.reminders.templates.dialog.namePlaceholder}
          />
        </div>

        {/* Channel + Timing row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>{t.reminders.templates.channel}</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((ch) => (
                  <SelectItem key={ch} value={ch}>
                    {t.reminders.templates.dialog[`channel${ch.charAt(0).toUpperCase() + ch.slice(1)}` as keyof typeof t.reminders.templates.dialog] ?? ch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{t.reminders.templates.timing}</Label>
            <Select value={timingKey} onValueChange={setTimingKey}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMING_KEYS.map((tk) => (
                  <SelectItem key={tk} value={tk}>
                    {t.reminders.templates.timingLabels[tk as keyof typeof t.reminders.templates.timingLabels] ?? tk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subject (email only) */}
        {isEmail && (
          <div className="grid gap-2">
            <Label>{t.reminders.templates.subject}</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t.reminders.templates.dialog.subjectPlaceholder}
            />
          </div>
        )}

        {/* Body + Variables side-by-side */}
        <div className="grid gap-2">
          <Label>{t.reminders.templates.body}</Label>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-3">
            <div className="space-y-1.5">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t.reminders.templates.dialog.bodyPlaceholder}
                rows={8}
                className="resize-none font-mono text-sm"
              />
              {isSms && (
                <p className={cn(
                  "text-xs",
                  smsOverLimit ? "text-destructive font-medium" : "text-muted-foreground",
                )}>
                  {t.reminders.templates.smsCounter.replace("{{count}}", String(smsLength))}
                  {smsOverLimit && ` — ${t.reminders.templates.smsWarning}`}
                </p>
              )}
            </div>

            {/* Variables panel */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-medium">{t.reminders.templates.variables}</p>
              <p className="text-muted-foreground text-[10px]">{t.reminders.templates.variableHint}</p>
              <div className="flex flex-wrap gap-1">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="inline-flex items-center rounded-md border bg-background px-1.5 py-0.5 text-[11px] font-mono hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  >
                    {v.key}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview tabs */}
        <div className="grid gap-2">
          <Label>{t.reminders.templates.preview}</Label>
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="h-8">
              <TabsTrigger value="preview" className="text-xs gap-1">
                <Eye className="size-3" />
                {t.reminders.templates.preview}
              </TabsTrigger>
              <TabsTrigger value="source" className="text-xs gap-1">
                <Code2 className="size-3" />
                Source
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-2">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                {isEmail && previewSubject && (
                  <p className="font-semibold">{previewSubject}</p>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{previewBody || "..."}</p>
              </div>
            </TabsContent>
            <TabsContent value="source" className="mt-2">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                {isEmail && subject && (
                  <p className="font-mono text-xs mb-2 opacity-70">{subject}</p>
                )}
                <p className="whitespace-pre-wrap font-mono text-xs">{body || "..."}</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t.common.cancel}
        </Button>
        <Button onClick={handleSave} disabled={saving || !canSave}>
          {saving
            ? t.common.saving
            : editTemplate
              ? t.reminders.templates.dialog.save
              : t.reminders.templates.dialog.create}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
```

**Commit:** `feat(templates): add TemplateFormDialog component with variables & preview`

---

## Task 10: Create TemplatesTab Component

**File:** Create `src/app/(professional)/pro/reminders/_components/TemplatesTab.tsx`

Orchestrator component: header, toolbar (search + filters), card grid, wires up TemplateCard + TemplateFormDialog.

```typescript
"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Search, Mail } from "lucide-react";
import { TemplateCard } from "./TemplateCard";
import { TemplateFormDialog } from "./TemplateFormDialog";
import type { Tables } from "@/lib/supabase/types";

type MessageTemplate = Tables<"message_templates">;

const CHANNELS = ["sms", "email", "whatsapp"] as const;
const TIMING_KEYS = ["j-2", "j-1", "h-24", "h-2", "h-1", "apres"] as const;

interface TemplatesTabProps {
  professionalId: string;
  professionalUserId: string;
  initialTemplates: MessageTemplate[];
}

export function TemplatesTab({
  professionalId,
  professionalUserId,
  initialTemplates,
}: TemplatesTabProps) {
  const { t } = useProfessionalI18n();

  // State
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [timingFilter, setTimingFilter] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  // Filtered templates
  const filtered = useMemo(() => {
    let result = templates;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (tpl) =>
          tpl.name.toLowerCase().includes(q) ||
          tpl.content.toLowerCase().includes(q),
      );
    }

    if (channelFilter !== "all") {
      result = result.filter((tpl) => tpl.channel === channelFilter);
    }

    if (timingFilter !== "all") {
      result = result.filter((tpl) => tpl.timing_key === timingFilter);
    }

    if (activeOnly) {
      result = result.filter((tpl) => tpl.is_active);
    }

    // Sort: own templates first, then globals
    return result.sort((a, b) => {
      if (a.is_global !== b.is_global) return a.is_global ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [templates, search, channelFilter, timingFilter, activeOnly]);

  // Handlers
  const handleToggle = useCallback(
    async (templateId: string, isActive: boolean) => {
      // Optimistic update
      setTemplates((prev) =>
        prev.map((tpl) =>
          tpl.id === templateId ? { ...tpl, is_active: isActive } : tpl,
        ),
      );

      const supabase = createClient();
      const { error } = await supabase
        .from("message_templates")
        .update({ is_active: isActive })
        .eq("id", templateId);

      if (error) {
        // Revert
        setTemplates((prev) =>
          prev.map((tpl) =>
            tpl.id === templateId ? { ...tpl, is_active: !isActive } : tpl,
          ),
        );
        toast.error(t.reminders.toast.error);
      } else {
        toast.success(
          isActive
            ? t.reminders.templates.toggledActive
            : t.reminders.templates.toggledInactive,
        );
      }
    },
    [t],
  );

  const handleSaved = useCallback((template: MessageTemplate) => {
    setTemplates((prev) => {
      const exists = prev.some((tpl) => tpl.id === template.id);
      if (exists) {
        return prev.map((tpl) => (tpl.id === template.id ? template : tpl));
      }
      return [template, ...prev];
    });
  }, []);

  const handleDuplicated = useCallback((template: MessageTemplate) => {
    setTemplates((prev) => [template, ...prev]);
  }, []);

  const handleDeleted = useCallback((templateId: string) => {
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== templateId));
  }, []);

  const handleEdit = useCallback((template: MessageTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  }, []);

  const handleNewTemplate = useCallback(() => {
    setEditingTemplate(null);
    setDialogOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t.reminders.templates.title}</h2>
          <p className="text-muted-foreground text-sm">
            {t.reminders.templates.subtitle}
          </p>
        </div>
        <Button onClick={handleNewTemplate} className="gap-1.5">
          <Plus className="size-4" />
          {t.reminders.templates.newTemplate}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.reminders.templates.search}
            className="pl-9"
          />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t.reminders.templates.filterChannel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.reminders.templates.allChannels}</SelectItem>
            {CHANNELS.map((ch) => (
              <SelectItem key={ch} value={ch}>
                {ch.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timingFilter} onValueChange={setTimingFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.reminders.templates.filterTiming} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.reminders.templates.allTimings}</SelectItem>
            {TIMING_KEYS.map((tk) => (
              <SelectItem key={tk} value={tk}>
                {t.reminders.templates.timingLabels[tk as keyof typeof t.reminders.templates.timingLabels] ?? tk}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            id="active-only"
            checked={activeOnly}
            onCheckedChange={setActiveOnly}
          />
          <Label htmlFor="active-only" className="text-sm cursor-pointer whitespace-nowrap">
            {t.reminders.templates.activeOnly}
          </Label>
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Mail}
              title={t.reminders.templates.empty.title}
              description={t.reminders.templates.empty.description}
              action={
                <Button variant="outline" onClick={handleNewTemplate} className="gap-1.5">
                  <Plus className="size-4" />
                  {t.reminders.templates.newTemplate}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              professionalId={professionalId}
              professionalUserId={professionalUserId}
              onEdit={handleEdit}
              onDuplicated={handleDuplicated}
              onDeleted={handleDeleted}
              onToggled={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        professionalId={professionalId}
        professionalUserId={professionalUserId}
        editTemplate={editingTemplate}
        onSaved={handleSaved}
      />
    </div>
  );
}
```

**Commit:** `feat(templates): add TemplatesTab orchestrator component`

---

## Task 11: Wire TemplatesTab into RemindersClient

**File:** Modify `src/app/(professional)/pro/reminders/_components/RemindersClient.tsx`

**Changes:**
1. Import `TemplatesTab`
2. Remove the inline templates tab content (lines 425-491)
3. Replace with `<TemplatesTab>` component
4. Remove `templates` from useState (no longer needed in parent — TemplatesTab manages its own state)
5. Keep passing `initialTemplates` to `NewReminderDialog` for the rule template dropdown

**Step 1:** Add import at top (after other imports):
```typescript
import { TemplatesTab } from "./TemplatesTab";
```

**Step 2:** Remove `const [templates] = useState<MessageTemplate[]>(initialTemplates);` (line 162). Keep `initialTemplates` prop access for the NewReminderDialog.

**Step 3:** Replace lines 425-491 (the entire templates TabsContent) with:
```tsx
<TabsContent value="templates" className="space-y-6">
  <TemplatesTab
    professionalId={professionalId}
    professionalUserId={professionalUserId}
    initialTemplates={initialTemplates}
  />
</TabsContent>
```

**Step 4:** Update NewReminderDialog references from `templates` to `initialTemplates`:
- Line 660: `templates={initialTemplates}`
- Line 673: `templates={initialTemplates}`

**Commit:** `feat(reminders): wire TemplatesTab into RemindersClient`

---

## Task 12: Verify & Run Advisors

**Steps:**
1. Run `npm run build` to check for TypeScript errors
2. Run Supabase security advisors via MCP `get_advisors` (type: security) to check RLS coverage
3. Regenerate Supabase types if needed after migrations
4. Test the page manually: open `/pro/reminders`, click "Modelos" tab, verify global templates appear, test CRUD

**Commit:** `chore: verify reminder templates feature`

---

## Task 13 (Partie C): Integration Plan — Connect Templates to Reminders

**No code changes needed** — the FK `reminder_rules.template_id → message_templates.id` already exists. The `NewReminderDialog` already has a template dropdown filtered by channel.

**Future enhancements (document only, don't implement):**
1. Filter template dropdown by `timing_key` matching the rule's trigger timing
2. When sending a notification, resolve the template body by replacing variables with actual appointment/patient data
3. Add a `template_id` column to `appointment_notifications` to track which template was used for each sent notification

**No commit needed for this task.**
