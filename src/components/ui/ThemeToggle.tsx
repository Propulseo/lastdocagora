"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useSyncExternalStore, useCallback } from "react"
import { flushSync } from "react-dom"

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

interface ThemeToggleProps {
  size?: "sm" | "md"
  variant?: "icon" | "pill"
  /** Aria-label when switching to light mode */
  lightLabel?: string
  /** Aria-label when switching to dark mode */
  darkLabel?: string
}

function useToggleTheme() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const toggle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const newTheme = isDark ? "light" : "dark"

      // Fallback if View Transitions API not supported
      if (
        !document.startViewTransition ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setTheme(newTheme)
        return
      }

      // Get click position as animation origin
      const x = e.clientX
      const y = e.clientY

      // Largest radius needed to cover the entire viewport
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      )

      const isMobile = window.innerWidth < 640

      const transition = document.startViewTransition(() => {
        flushSync(() => setTheme(newTheme))
      })

      transition.ready.then(() => {
        if (isMobile) {
          // Smooth crossfade on mobile
          document.documentElement.animate(
            { opacity: [0, 1] },
            {
              duration: 400,
              easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              pseudoElement: "::view-transition-new(root)",
            },
          )
        } else {
          // Circle wipe on desktop
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${maxRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 500,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            },
          )
        }
      })
    },
    [isDark, setTheme],
  )

  return { isDark, toggle }
}

export function ThemeToggle({
  size = "md",
  variant = "icon",
  lightLabel = "Switch to light mode",
  darkLabel = "Switch to dark mode",
}: ThemeToggleProps) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const { isDark, toggle } = useToggleTheme()

  if (!mounted) return <div className={size === "sm" ? "size-8" : "size-9"} />

  if (variant === "pill") {
    return (
      <button
        onClick={toggle}
        className={`
          relative flex items-center gap-2 px-3 py-1.5 rounded-full
          text-sm font-medium transition-colors
          ${isDark
            ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }
        `}
        aria-label={isDark ? lightLabel : darkLabel}
      >
        {isDark
          ? <><Sun size={14} /> {lightLabel}</>
          : <><Moon size={14} /> {darkLabel}</>
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
      onClick={toggle}
      className={`
        relative ${btnClass} flex items-center justify-center shrink-0
        transition-colors
        ${isDark
          ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
        }
      `}
      aria-label={isDark ? lightLabel : darkLabel}
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
