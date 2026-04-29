"use client"

import Image from "next/image"

interface MobileHeaderProps {
  title: string
  leftAction?: React.ReactNode
  children: React.ReactNode
}

export function MobileHeader({ title, leftAction, children }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/95 px-3 backdrop-blur-sm lg:hidden">
      <div className="flex shrink-0 items-center gap-1">
        {leftAction}
        <Image
          src="/logo-icon.png"
          alt="DocAgora"
          width={40}
          height={40}
          className="size-10 object-contain"
        />
      </div>

      <span className="mx-2 min-w-0 flex-1 truncate text-center text-sm font-semibold text-foreground">
        {title}
      </span>

      <div className="flex shrink-0 items-center gap-0.5">
        {children}
      </div>
    </header>
  )
}
