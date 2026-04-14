"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Code2 } from "lucide-react";
import type { useProfessionalI18n } from "@/lib/i18n/pro";
import { RADIUS } from "@/lib/design-tokens";

const TEMPLATE_VARIABLES = [
  { key: "{patient_prenom}", example: "Maria" },
  { key: "{patient_nom}", example: "Silva" },
  { key: "{date}", example: "25/02/2026" },
  { key: "{heure}", example: "14:30" },
  { key: "{adresse}", example: "Rua das Flores 123, Lisboa" },
  { key: "{pro_nom}", example: "Dr. Santos" },
  { key: "{lien_annulation}", example: "https://..." },
  { key: "{lien_confirmation}", example: "https://..." },
  { key: "{tel_cabinet}", example: "+351 21 000 0000" },
] as const;

interface TemplateContentEditorProps {
  body: string;
  onBodyChange: (value: string) => void;
  subject: string;
  isEmail: boolean;
  isSms: boolean;
  smsLength: number;
  smsOverLimit: boolean;
  onInsertVariable: (varKey: string) => void;
  t: ReturnType<typeof useProfessionalI18n>["t"];
}

export function TemplateContentEditor({
  body,
  onBodyChange,
  subject,
  isEmail,
  isSms,
  smsLength,
  smsOverLimit,
  onInsertVariable,
  t,
}: TemplateContentEditorProps) {
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

  return (
    <>
      {/* Body + Variables side-by-side */}
      <div className="grid gap-2">
        <Label>{t.reminders.templates.body}</Label>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-3">
          <div className="space-y-1.5">
            <Textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder={t.reminders.templates.dialog.bodyPlaceholder}
              rows={8}
              className="resize-none font-mono text-sm"
            />
            {isSms && (
              <p
                className={cn(
                  "text-xs",
                  smsOverLimit
                    ? "text-destructive font-medium"
                    : "text-muted-foreground",
                )}
              >
                {t.reminders.templates.smsCounter.replace(
                  "{{count}}",
                  String(smsLength),
                )}
                {smsOverLimit && ` — ${t.reminders.templates.smsWarning}`}
              </p>
            )}
          </div>

          <div className={`${RADIUS.sm} border bg-muted/30 p-3 space-y-2`}>
            <p className="text-xs font-medium">
              {t.reminders.templates.variables}
            </p>
            <p className="text-muted-foreground text-[10px]">
              {t.reminders.templates.variableHint}
            </p>
            <div className="flex flex-wrap gap-1">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => onInsertVariable(v.key)}
                  className={`inline-flex items-center ${RADIUS.sm} border bg-background px-1.5 py-0.5 text-[11px] font-mono hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer`}
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
              {t.reminders.templates.source}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-2">
            <div className={`${RADIUS.sm} border bg-muted/30 p-4 space-y-2 text-sm`}>
              {isEmail && previewSubject && (
                <p className="font-semibold">{previewSubject}</p>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">
                {previewBody || "..."}
              </p>
            </div>
          </TabsContent>
          <TabsContent value="source" className="mt-2">
            <div className={`${RADIUS.sm} border bg-muted/30 p-4 text-sm`}>
              {isEmail && subject && (
                <p className="font-mono text-xs mb-2 opacity-70">{subject}</p>
              )}
              <p className="whitespace-pre-wrap font-mono text-xs">
                {body || "..."}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
