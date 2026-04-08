"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function PublicSearchHeader() {
  return (
    <header className="flex h-14 items-center border-b px-4">
      <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
        DOC<span className="text-[#0891B2]">AGORA</span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Entrar</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/login#register">
            <span className="hidden sm:inline">Criar conta</span>
            <span className="sm:hidden">Criar</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
