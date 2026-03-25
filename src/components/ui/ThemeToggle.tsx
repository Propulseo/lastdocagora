"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

interface ThemeToggleProps {
  size?: "sm" | "md"
  variant?: "icon" | "pill"
}

export function ThemeToggle({
  size = "md",
  variant = "icon"
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className={size === "sm" ? "size-8" : "size-9"} />

  const isDark = resolvedTheme === "dark"

  if (variant === "pill") {
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`
          relative flex items-center gap-2 px-3 py-1.5 rounded-full
          text-sm font-medium transition-colors
          ${isDark
            ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }
        `}
        aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      >
        {isDark
          ? <><Sun size={14} /> Modo claro</>
          : <><Moon size={14} /> Modo escuro</>
        }
      </button>
    )
  }

  const iconSize = size === "sm" ? 16 : 18
  const btnClass = size === "sm"
    ? "size-8 rounded-md"
    : "size-9 rounded-lg"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        relative ${btnClass} flex items-center justify-center shrink-0
        transition-colors
        ${isDark
          ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
        }
      `}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      <Sun
        size={iconSize}
        className={`absolute transition-all duration-300
          ${isDark
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-50"
          }`}
      />
      <Moon
        size={iconSize}
        className={`absolute transition-all duration-300
          ${isDark
            ? "opacity-0 -rotate-90 scale-50"
            : "opacity-100 rotate-0 scale-100"
          }`}
      />
    </button>
  )
}
