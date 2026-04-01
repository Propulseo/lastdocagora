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
import { TemplateDeleteDialog } from "./template-delete-dialog";
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
  sms: {
    icon: Smartphone,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  email: {
    icon: Mail,
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  whatsapp: {
    icon: MessageSquare,
    color: "bg-green-500/10 text-green-600 border-green-200",
  },
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
  const { t, locale } = useProfessionalI18n();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isGlobal = template.is_global;
  const isOwn = template.professional_user_id === professionalUserId;
  const channelCfg =
    CHANNEL_CONFIG[template.channel as keyof typeof CHANNEL_CONFIG] ??
    CHANNEL_CONFIG.sms;
  const ChannelIcon = channelCfg.icon;

  const timingLabel = template.timing_key
    ? (t.reminders.templates.timingLabels[
        template.timing_key as keyof typeof t.reminders.templates.timingLabels
      ] ?? template.timing_key)
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
        locale,
      })
      .select("*")
      .single();

    if (error) {
      toast.error(t.reminders.toast.error);
    } else {
      toast.success(t.reminders.templates.duplicateSuccess);
      onDuplicated(data);
    }
  }, [template, professionalId, professionalUserId, t, locale, onDuplicated]);

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
      <Card
        className={cn(
          "group transition-all hover:shadow-md",
          !template.is_active && "opacity-60",
        )}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header row: name + actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate">{template.name}</h3>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isOwn && !isGlobal && (
                <Switch
                  checked={template.is_active}
                  onCheckedChange={(checked) => onToggled(template.id, checked)}
                  className="scale-90"
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(template)}>
                    <Pencil className="mr-2 size-4" />
                    {t.reminders.templates.edit}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="mr-2 size-4" />
                    {t.reminders.templates.duplicate}
                  </DropdownMenuItem>
                  {isOwn && !isGlobal && (
                    <>
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
            <Badge
              variant="outline"
              className={cn("gap-1 text-xs", channelCfg.color)}
            >
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
              className={cn(
                "gap-1 text-xs",
                isGlobal
                  ? "bg-amber-500/10 text-amber-600 border-amber-200"
                  : "bg-violet-500/10 text-violet-600 border-violet-200",
              )}
            >
              {isGlobal ? (
                <Globe className="size-3" />
              ) : (
                <User className="size-3" />
              )}
              {isGlobal
                ? t.reminders.templates.global
                : t.reminders.templates.mine}
            </Badge>
          </div>

          {/* Content preview */}
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
            {template.content}
          </p>
        </CardContent>
      </Card>

      <TemplateDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        confirmTitle={t.reminders.templates.deleteConfirm}
        confirmDescription={t.reminders.templates.deleteDescription}
        cancelLabel={t.common.cancel}
        deleteLabel={t.reminders.templates.delete}
      />
    </>
  );
}
