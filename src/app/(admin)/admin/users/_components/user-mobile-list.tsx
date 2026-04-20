"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MoreHorizontal, UserCheck, Ban, Trash2 } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { getAvatarColor, type UserRow } from "./users-table";

interface UserMobileListProps {
  data: UserRow[];
  actionSheet: UserRow | null;
  onOpenActionSheet: (row: UserRow) => void;
  onCloseActionSheet: () => void;
  onAction: (userId: string, status: string, label: string) => void;
  currentUserId?: string;
}

export function UserMobileList({
  data,
  actionSheet,
  onOpenActionSheet,
  onCloseActionSheet,
  onAction,
  currentUserId,
}: UserMobileListProps) {
  const { t } = useAdminI18n();

  return (
    <>
      <div className="space-y-2 sm:hidden">
        {data.map((row) => {
          const fullName = `${row.first_name} ${row.last_name}`;
          const bg = getAvatarColor(fullName);
          return (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Avatar className="size-10 shrink-0">
                {row.avatar_url && <AvatarImage src={row.avatar_url} alt={fullName} />}
                <AvatarFallback
                  style={{ backgroundColor: bg, color: "white" }}
                  className="text-[13px] font-semibold"
                >
                  {row.first_name?.[0] ?? ""}
                  {row.last_name?.[0] ?? ""}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {row.email}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StatusBadge
                  type="role"
                  value={row.role}
                  labels={t.statuses.role}
                />
                <StatusBadge
                  type="userStatus"
                  value={row.status ?? "active"}
                  labels={t.statuses.userStatus}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] shrink-0"
                onClick={() => onOpenActionSheet(row)}
                aria-label={t.mobile.actions}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Sheet
        open={!!actionSheet}
        onOpenChange={(open) => !open && onCloseActionSheet()}
      >
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle>
              {actionSheet
                ? `${actionSheet.first_name} ${actionSheet.last_name}`
                : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-2 space-y-1">
            {actionSheet && (actionSheet.status ?? "active") !== "active" && (
              <button
                onClick={() =>
                  onAction(actionSheet.id, "active", t.users.activate)
                }
                className="flex h-14 w-full items-center gap-3 rounded-md px-4 text-sm hover:bg-accent transition-colors"
              >
                <UserCheck className="size-4" />
                {t.users.activate}
              </button>
            )}
            {actionSheet && actionSheet.id !== currentUserId && (actionSheet.status ?? "active") !== "suspended" && (
              <button
                onClick={() =>
                  onAction(actionSheet.id, "suspended", t.users.suspend)
                }
                className="flex h-14 w-full items-center gap-3 rounded-md px-4 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Ban className="size-4" />
                {t.users.suspend}
              </button>
            )}
            {actionSheet && actionSheet.id !== currentUserId && (
              <button
                onClick={() =>
                  onAction(actionSheet.id, "delete", t.users.delete)
                }
                className="flex h-14 w-full items-center gap-3 rounded-md px-4 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="size-4" />
                {t.users.delete}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
