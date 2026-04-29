"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

const PROGRESS_DURATION = 12000
const MIN_VISIBLE_MS = 300
const COMPLETE_DURATION = 200

export function PageTransitionLoader() {
  const pathname = usePathname()
  const [state, setState] = useState<"idle" | "loading" | "completing">("idle")
  const progressRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef(0)
  const prevPathnameRef = useRef(pathname)
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startProgress = useCallback(() => {
    progressRef.current = 0
    startTimeRef.current = Date.now()
    setState("loading")

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current
      // Asymptotic curve: fast start, slows toward ~90%
      const t = elapsed / PROGRESS_DURATION
      progressRef.current = 90 * (1 - Math.exp(-3 * t))

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progressRef.current / 100})`
      }

      if (progressRef.current < 89.5) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
  }, [])

  const completeProgress = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    const elapsed = Date.now() - startTimeRef.current
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)

    const finish = () => {
      if (barRef.current) {
        barRef.current.style.transform = "scaleX(1)"
      }
      progressRef.current = 100
      setState("completing")

      completeTimerRef.current = setTimeout(() => {
        setState("idle")
        progressRef.current = 0
      }, COMPLETE_DURATION)
    }

    if (remaining > 0) {
      completeTimerRef.current = setTimeout(finish, remaining)
    } else {
      finish()
    }
  }, [])

  // Detect navigation start via click on internal links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return
      if (anchor.target === "_blank") return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      // Same pathname — no navigation
      try {
        const url = new URL(href, window.location.origin)
        if (url.pathname === window.location.pathname) return
      } catch {
        return
      }

      startProgress()
    }

    // Detect back/forward navigation
    const handlePopState = () => {
      startProgress()
    }

    document.addEventListener("click", handleClick, { capture: true })
    window.addEventListener("popstate", handlePopState)

    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
      window.removeEventListener("popstate", handlePopState)
    }
  }, [startProgress])

  // Detect navigation completion via pathname change
  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname
      if (state === "loading") {
        completeProgress()
      }
    }
  }, [pathname, state, completeProgress])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current)
    }
  }, [])

  if (state === "idle") return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2px]"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-primary transition-opacity duration-200"
        style={{
          transform: `scaleX(${progressRef.current / 100})`,
          opacity: state === "completing" ? 0 : 1,
        }}
      >
        <div className="absolute right-0 top-0 h-full w-16 -translate-y-px rotate-3 bg-primary opacity-80 shadow-[0_0_8px_var(--color-primary)]" />
      </div>
    </div>
  )
}
