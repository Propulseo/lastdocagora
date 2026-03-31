import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Brand ── */}
      <div className="hidden lg:flex lg:w-[54%] relative overflow-hidden bg-gradient-to-br from-[#0b3d40] via-[#0f4f54] to-[#071f21]">
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative floating shapes */}
        <div
          className="absolute top-[12%] left-[8%] w-72 h-72 rounded-full bg-white/[0.025]"
          style={{ animation: "authFloat 9s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[18%] right-[12%] w-52 h-52 rounded-full bg-[#3da4ab]/[0.06]"
          style={{
            animation: "authFloat 11s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute top-[55%] left-[35%] w-36 h-36 rounded-full bg-white/[0.015]"
          style={{
            animation: "authFloat 13s ease-in-out infinite",
            animationDelay: "4s",
          }}
        />

        {/* Decorative lines */}
        <div className="absolute top-0 right-[28%] w-px h-[38%] bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
        <div className="absolute bottom-0 left-[18%] w-px h-[28%] bg-gradient-to-t from-transparent via-white/[0.08] to-transparent" />

        {/* Glowing orb accent */}
        <div
          className="absolute top-[30%] right-[20%] w-40 h-40 rounded-full bg-[#3da4ab]/10 blur-3xl"
          style={{ animation: "authGlow 6s ease-in-out infinite" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          {/* Logo */}
          <div>
            <h1 className="font-display text-[2.75rem] font-[600] text-white tracking-[-0.02em] leading-none">
              DOCAGORA
            </h1>
            <div className="mt-3 h-[2px] w-11 rounded-full bg-[#4dbdc4]" />
          </div>

          {/* Tagline */}
          <div className="max-w-[420px]">
            <p className="font-display text-[1.85rem] text-white/90 leading-[1.25] italic tracking-[-0.01em]">
              A sua saúde merece o melhor cuidado
            </p>
            <p className="mt-5 font-body text-[1.05rem] text-white/40 leading-relaxed">
              Encontre profissionais de saúde qualificados e marque consultas de
              forma simples e segura.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="font-body text-[0.8rem] tracking-wide text-white/25 uppercase">
              Plataforma médica em Portugal
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-background">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
