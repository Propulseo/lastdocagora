"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Send,
  Wrench,
  User,
  CreditCard,
  Bug,
  HelpCircle,
} from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { createTicket } from "@/app/(professional)/_actions/pro-support-actions";
import { RADIUS } from "@/lib/design-tokens";

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_KEYS = [
  "technical",
  "profile",
  "payment",
  "bug",
  "other",
] as const;

const catIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  technical: Wrench,
  profile: User,
  payment: CreditCard,
  bug: Bug,
  other: HelpCircle,
};

export function NewTicketDialog({ open, onOpenChange }: NewTicketDialogProps) {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const { t } = useProfessionalI18n();

  const s = t.support as Record<string, unknown>;
  const categories = (s.categories ?? {}) as Record<string, string>;

  const canSubmit = category && message.length >= 20;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSending(true);
    const subject = categories[category] ?? category;
    const result = await createTicket(subject, message);
    setSending(false);

    if (result.success) {
      toast.success(
        (s.ticketCreated as string) ?? "Ticket created"
      );
      setCategory("");
      setMessage("");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(
        (s.errorCreating as string) ?? "Error creating ticket"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md ${RADIUS.card}`}>
        <DialogHeader>
          <DialogTitle>{(s.newTicket as string) ?? "New ticket"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {(s.categoryLabel as string) ?? "Subject"}
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9">
                <SelectValue
                  placeholder={
                    (s.categoryPlaceholder as string) ?? "Select a category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_KEYS.map((key) => {
                  const Icon = catIcons[key] ?? HelpCircle;
                  return (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <Icon className="size-3.5 text-muted-foreground" />
                        {categories[key] ?? key}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {(s.messageLabel as string) ?? "Message"}
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                (s.messagePlaceholder as string) ?? "Describe your issue..."
              }
              rows={5}
              maxLength={1000}
              className="resize-none text-sm"
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
              <span>
                {message.length < 20
                  ? ((s.messageMinLength as string) ?? "Minimum 20 characters")
                  : ""}
              </span>
              <span className="tabular-nums">
                {message.length}/1000{" "}
                {(s.characters as string) ?? "characters"}
              </span>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || sending}
            className="w-full gap-1.5"
            size="sm"
          >
            <Send className="size-3" />
            {sending
              ? ((s.sending as string) ?? "Sending...")
              : ((s.send as string) ?? "Send")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
