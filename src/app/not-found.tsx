import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";

const translations: Record<string, { title: string; description: string; backHome: string }> = {
  pt: {
    title: "Pagina nao encontrada",
    description: "A pagina que procura nao existe ou foi movida.",
    backHome: "Voltar ao inicio",
  },
  fr: {
    title: "Page introuvable",
    description: "La page que vous recherchez n\u2019existe pas ou a ete deplacee.",
    backHome: "Retour a l\u2019accueil",
  },
  en: {
    title: "Page not found",
    description: "The page you are looking for does not exist or has been moved.",
    backHome: "Back to home",
  },
};

export default async function NotFound() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("docagora_lang")?.value;
  const t = translations[lang ?? "pt"] ?? translations.pt;

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

      <p className="text-7xl font-bold tabular-nums text-primary">404</p>

      <h1 className="mt-4 text-xl font-semibold text-foreground">
        {t.title}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t.description}
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t.backHome}
      </Link>
    </div>
  );
}
