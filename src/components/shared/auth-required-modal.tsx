"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AuthRequiredModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthRequiredModal({ open, onOpenChange }: AuthRequiredModalProps) {
  const pathname = usePathname()
  const redirect = encodeURIComponent(pathname)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inicie sessao para continuar</DialogTitle>
          <DialogDescription>
            Para marcar uma consulta, precisa de ter uma conta DOCAGORA.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button asChild>
            <Link href={`/login?redirect=${redirect}`}>
              Iniciar sessao
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/login?redirect=${redirect}#register`}>
              Criar conta
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
