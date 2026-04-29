"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleContentPublished } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { resolveErrorMessage } from "@/lib/error-messages";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface PublishSwitchProps {
  type: "page" | "faq";
  id: string;
  published: boolean;
}

export function PublishSwitch({ type, id, published }: PublishSwitchProps) {
  const { t } = useAdminI18n();
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleContentPublished(type, id, checked);
      if (result.success) {
        toast.success(checked ? t.content.published : t.content.unpublished);
      } else {
        toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
      }
    });
  }

  return (
    <Switch
      defaultChecked={published}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label={published ? t.content.unpublishLabel : t.content.publishLabel}
    />
  );
}
