"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";

interface ProHeaderUserMenuProps {
  user: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export function ProHeaderUserMenu({ user }: ProHeaderUserMenuProps) {
  const router = useRouter();
  const { t } = useProfessionalI18n();
  const initials =
    (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "");

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="group/user relative flex items-center gap-2">
      <span className="max-w-[120px] truncate text-sm font-medium">
        {user.firstName} {user.lastName}
      </span>
      <Avatar size="sm">
        {user.avatarUrl && (
          <AvatarImage src={user.avatarUrl} alt={initials} />
        )}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="absolute right-0 top-full pt-1 opacity-0 pointer-events-none group-hover/user:opacity-100 group-hover/user:pointer-events-auto transition-opacity duration-150">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 whitespace-nowrap rounded-md border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-md hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4" />
          {t.sidebar.logout}
        </button>
      </div>
    </div>
  );
}
