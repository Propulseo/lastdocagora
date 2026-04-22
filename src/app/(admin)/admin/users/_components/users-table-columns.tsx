import type { ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Ban, UserCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor, type UserRow } from "./users-table";

export function buildColumns(
  t: Record<string, unknown>,
  dateLocale: string,
  multiRoleUsers: Set<string>,
  currentUserId: string | undefined,
  handleAction: (userId: string, status: string, label: string) => void,
): ColumnDef<UserRow>[] {
  const tCommon = t.common as Record<string, string>;
  const tUsers = t.users as Record<string, string>;
  const tStatuses = t.statuses as Record<string, Record<string, string>>;

  return [
    {
      key: "name",
      header: tCommon.name,
      className: "w-[35%]",
      render: (row) => {
        const fullName = `${row.first_name} ${row.last_name}`;
        const bg = getAvatarColor(fullName);
        const isMultiRole = multiRoleUsers.has(fullName.toLowerCase());
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-[34px]">
              {row.avatar_url && <AvatarImage src={row.avatar_url} alt={fullName} />}
              <AvatarFallback style={{ backgroundColor: bg, color: "white" }} className="text-[13px] font-semibold">
                {row.first_name?.[0] ?? ""}{row.last_name?.[0] ?? ""}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold truncate">{fullName}</span>
                {isMultiRole && (
                  <span style={{
                    display: "inline-block", borderRadius: "9999px", padding: "2px 8px",
                    fontSize: "10px", fontWeight: 600, backgroundColor: "#dbeafe", color: "#1d4ed8",
                  }}>
                    {tUsers.multiRoleAccount}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-muted-foreground truncate">{row.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: tUsers.tableRole,
      render: (row) => <StatusBadge type="role" value={row.role} labels={tStatuses.role} />,
    },
    {
      key: "status",
      header: tCommon.status,
      render: (row) => <StatusBadge type="userStatus" value={row.status ?? "active"} labels={tStatuses.userStatus} />,
    },
    {
      key: "created_at",
      header: tUsers.tableRegisteredAt,
      render: (row) =>
        row.created_at
          ? new Intl.DateTimeFormat(dateLocale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(row.created_at))
          : "\u2014",
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={tCommon.actions}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAction(row.id, "edit", tUsers.edit)}>
              <Pencil className="mr-2 size-4" />
              {tUsers.edit}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.id !== currentUserId && (
              (row.status ?? "active") === "suspended" ? (
                <DropdownMenuItem onClick={() => handleAction(row.id, "unban", tUsers.unban)}>
                  <UserCheck className="mr-2 size-4" />
                  {tUsers.unban}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleAction(row.id, "ban", tUsers.ban)} className="text-destructive">
                  <Ban className="mr-2 size-4" />
                  {tUsers.ban}
                </DropdownMenuItem>
              )
            )}
            {row.id !== currentUserId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleAction(row.id, "delete", tUsers.delete)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  {tUsers.delete}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
