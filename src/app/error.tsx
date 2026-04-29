"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const translations: Record<string, { title: string; description: string; retry: string; backHome: string }> = {
  pt: {
    title: "Algo correu mal",
    description: "Ocorreu um erro inesperado. Tente novamente ou volte ao inicio.",
    retry: "Tentar novamente",
    backHome: "Voltar ao inicio",
  },
  fr: {
    title: "Une erreur est survenue",
    description: "Une erreur inattendue s\u2019est produite. Veuillez reessayer ou revenir a l\u2019accueil.",
    retry: "Reessayer",
    backHome: "Retour a l\u2019accueil",
  },
  en: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again or go back to the home page.",
    retry: "Try again",
    backHome: "Back to home",
  },
};

function getLocaleFromCookie(): string {
  if (typeof document === "undefined") return "pt";
  const match = document.cookie.match(/(?:^|;\s*)docagora_lang=(\w+)/);
  return match?.[1] ?? "pt";
}

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to console in dev only — no technical info leaked to UI
    console.error("[ErrorBoundary]", error.digest ?? error.message);
  }, [error]);

  const lang = getLocaleFromCookie();
  const t = translations[lang] ?? translations.pt;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 text-center">
      <Image
        src="/logo.png"
        alt="DocAgora"
        width={180}
        height={48}
        className="mb-8 dark:brightness-0 dark:invert"
        priority
      />

      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <svg
          className="size-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <h1 className="mt-6 text-xl font-semibold text-foreground">
        {t.title}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t.description}
      </p>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t.retry}
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t.backHome}
        </Link>
      </div>
    </div>
  );
}
