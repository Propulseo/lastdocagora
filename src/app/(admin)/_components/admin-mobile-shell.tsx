"use client";

import { useState } from "react";
import { AdminMobileHeader } from "./admin-mobile-header";
import { AdminMobileNav } from "./admin-mobile-nav";

interface AdminMobileShellProps {
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
  userId: string;
  openTicketCount: number;
}

export function AdminMobileShell({ user, userId, openTicketCount }: AdminMobileShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <AdminMobileHeader
        user={{ firstName: user.first_name, lastName: user.last_name }}
        userId={userId}
        onMenuOpen={() => setMenuOpen(true)}
      />
      <AdminMobileNav
        open={menuOpen}
        onOpenChange={setMenuOpen}
        user={user}
        openTicketCount={openTicketCount}
      />
    </>
  );
}
