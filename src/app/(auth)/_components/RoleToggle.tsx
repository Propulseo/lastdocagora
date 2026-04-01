"use client"

import { cn } from "@/lib/utils"

interface RoleToggleProps {
  value: "patient" | "professional"
  onChange: (role: "patient" | "professional") => void
  patientLabel: string
  professionalLabel: string
}

export function RoleToggle({ value, onChange, patientLabel, professionalLabel }: RoleToggleProps) {
  return (
    <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-6">
      {(["patient", "professional"] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "flex-1 py-2 rounded-[9px] text-sm font-medium transition-all",
            value === r
              ? "bg-[#0891B2] text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {r === "patient" ? patientLabel : professionalLabel}
        </button>
      ))}
    </div>
  )
}
