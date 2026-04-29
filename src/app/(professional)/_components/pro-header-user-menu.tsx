"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatarMenu } from "@/components/shared/user-avatar-menu";
import { useProfessionalI18n } from "@/lib/i18n/pro";

interface ProHeaderUserMenuProps {
  user: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export function ProHeaderUserMenu({ user }: ProHeaderUserMenuProps) {
  const { t } = useProfessionalI18n();
  const initials =
    (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "");

  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[120px] truncate text-sm font-medium">
        {user.firstName} {user.lastName}
      </span>
      <UserAvatarMenu
        user={{ avatarUrl: user.avatarUrl, initials }}
        profileHref="/pro/profile"
        translations={{
          myProfile: t.sidebar.myProfile,
          logout: t.sidebar.logout,
        }}
      />
    </div>
  );
}
