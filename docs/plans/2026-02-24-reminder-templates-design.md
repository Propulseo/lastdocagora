# Reminder Templates - Design

## Context
Enhance the "Modèles" tab in the PRO Reminders page with full CRUD, global template seeding, and premium UX.

## Database (Partie A)
- ALTER `message_templates`: add `is_global` (boolean, default false), `timing_key` (check constraint: j-2, j-1, h-24, h-2, h-1, apres)
- New indexes: (professional_user_id, is_active), (is_global, is_active), (channel), (timing_key)
- Trigger: auto-update `updated_at`
- RLS: SELECT if pro_user_id=auth.uid() OR is_global=true; INSERT/UPDATE/DELETE only own non-global
- Seed 10 global templates (FR/PT, SMS/Email/WhatsApp) with variables
- SQL function `duplicate_global_templates_for_pro()` callable from app

## Frontend (Partie B)
- New `TemplatesTab.tsx`: header + toolbar (search, channel filter, timing filter, active toggle) + card grid
- New `TemplateCard.tsx`: name, badges, preview, toggle, actions (edit/duplicate/delete for own; duplicate-only for global)
- New `TemplateFormDialog.tsx`: full form with name, channel, timing, subject (email), body textarea, SMS counter, clickable variable sidebar, live preview
- Modify `RemindersClient.tsx`: extract templates tab to new component, pass state + callbacks
- Data: optimistic updates + refetch (existing pattern), no realtime

## Integration (Partie C)
- Existing FK `reminder_rules.template_id → message_templates.id` stays
- Enhance `NewReminderDialog.tsx`: filter templates by timing_key matching trigger_moment

## File Structure
```
src/app/(professional)/pro/reminders/_components/
├── RemindersClient.tsx          (modify)
├── TemplatesTab.tsx             (new)
├── TemplateCard.tsx             (new)
├── TemplateFormDialog.tsx       (new)
└── NewReminderDialog.tsx        (modify)
```
