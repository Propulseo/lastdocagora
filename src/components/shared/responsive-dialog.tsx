"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobileLg } from "@/hooks/use-mobile-lg"

interface ResponsiveDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isMobile = useIsMobileLg()

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children}
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

function ResponsiveDialogTrigger({ children, ...props }: React.ComponentProps<typeof DialogTrigger>) {
  const isMobile = useIsMobileLg()
  if (isMobile) return <SheetTrigger {...props}>{children}</SheetTrigger>
  return <DialogTrigger {...props}>{children}</DialogTrigger>
}

function ResponsiveDialogContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const isMobile = useIsMobileLg()

  if (isMobile) {
    return (
      <SheetContent side="bottom" className="max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className={className}>{children}</div>
        </ScrollArea>
      </SheetContent>
    )
  }

  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({ children, ...props }: React.ComponentProps<typeof DialogHeader>) {
  const isMobile = useIsMobileLg()
  if (isMobile) return <SheetHeader {...props}>{children}</SheetHeader>
  return <DialogHeader {...props}>{children}</DialogHeader>
}

function ResponsiveDialogTitle({ children, ...props }: React.ComponentProps<typeof DialogTitle>) {
  const isMobile = useIsMobileLg()
  if (isMobile) return <SheetTitle {...props}>{children}</SheetTitle>
  return <DialogTitle {...props}>{children}</DialogTitle>
}

function ResponsiveDialogDescription({ children, ...props }: React.ComponentProps<typeof DialogDescription>) {
  const isMobile = useIsMobileLg()
  if (isMobile) return <SheetDescription {...props}>{children}</SheetDescription>
  return <DialogDescription {...props}>{children}</DialogDescription>
}

function ResponsiveDialogFooter({ children, ...props }: React.ComponentProps<typeof DialogFooter>) {
  const isMobile = useIsMobileLg()
  if (isMobile) return <SheetFooter {...props}>{children}</SheetFooter>
  return <DialogFooter {...props}>{children}</DialogFooter>
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
}
