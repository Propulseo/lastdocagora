"use client";

import { useEffect } from "react";

export function RoleBodyClass({ role }: { role: string }) {
  useEffect(() => {
    document.body.classList.add(role);
    return () => {
      document.body.classList.remove(role);
    };
  }, [role]);

  return null;
}
