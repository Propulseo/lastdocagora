"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react";

function getErrorMessage(msg: string): string {
  if (msg.includes("Invalid login credentials")) {
    return "Email ou palavra-passe incorretos. Verifique os seus dados e tente novamente.";
  }
  if (msg.includes("Email not confirmed")) {
    return "O seu email ainda não foi confirmado. Verifique a sua caixa de entrada.";
  }
  if (msg.includes("Too many requests")) {
    return "Demasiadas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  }
  return msg;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(getErrorMessage(error.message));
        setErrorDialogOpen(true);
        triggerShake();
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = userData?.role;
        if (role === "admin") router.push("/admin/dashboard");
        else if (role === "professional") router.push("/pro/dashboard");
        else router.push("/patient/dashboard");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro de conexão ao servidor"
      );
      setErrorDialogOpen(true);
      triggerShake();
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Mobile brand header ── */}
      <div className="lg:hidden text-center mb-10">
        <h1 className="font-display text-[1.85rem] font-[600] tracking-[-0.02em]">
          DOCAGORA
        </h1>
        <div className="mt-2.5 mx-auto h-[2px] w-9 rounded-full bg-[#3da4ab]" />
      </div>

      <div className={shaking ? "auth-shake" : ""}>
        {/* ── Heading ── */}
        <div className="mb-9 auth-fade-up" style={{ animationDelay: "0ms" }}>
          <h2 className="font-display text-[1.65rem] font-[500] tracking-[-0.02em] leading-tight">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 font-body text-[0.95rem] text-muted-foreground">
            Inicie sessão para aceder à sua conta
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleLogin} noValidate className="space-y-5">
          {/* Email */}
          <div
            className="space-y-2.5 auth-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            <Label
              htmlFor="email"
              className="font-body text-[0.825rem] font-medium"
            >
              Endereço de email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nome@exemplo.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              className="h-[2.75rem] font-body bg-muted/40 border-border/50 placeholder:text-muted-foreground/35 focus-visible:ring-[#3da4ab]/25 focus-visible:border-[#3da4ab]/50 transition-all duration-200"
            />
          </div>

          {/* Password */}
          <div
            className="space-y-2.5 auth-fade-up"
            style={{ animationDelay: "150ms" }}
          >
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="font-body text-[0.825rem] font-medium"
              >
                Palavra-passe
              </Label>
              <button
                type="button"
                tabIndex={-1}
                className="font-body text-[0.75rem] text-muted-foreground/70 hover:text-foreground transition-colors duration-200"
              >
                Esqueceu-se?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="h-[2.75rem] pr-10 font-body bg-muted/40 border-border/50 placeholder:text-muted-foreground/35 focus-visible:ring-[#3da4ab]/25 focus-visible:border-[#3da4ab]/50 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/80 transition-colors duration-200"
                aria-label={
                  showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-[1.1rem] w-[1.1rem]" />
                ) : (
                  <Eye className="h-[1.1rem] w-[1.1rem]" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div
            className="auth-fade-up pt-1"
            style={{ animationDelay: "220ms" }}
          >
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-[2.75rem] font-body font-medium tracking-[0.01em] bg-[#0b3d40] hover:bg-[#154d50] active:bg-[#0a3235] dark:bg-[#3da4ab] dark:hover:bg-[#4dbdc4] dark:active:bg-[#349a9f] dark:text-[#071f21] shadow-sm transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Iniciar sessão
            </Button>
          </div>

          {/* Divider */}
          <div
            className="auth-fade-up flex items-center gap-4 py-1"
            style={{ animationDelay: "290ms" }}
          >
            <div className="h-px flex-1 bg-border/50" />
            <span className="font-body text-[0.7rem] tracking-widest uppercase text-muted-foreground/40">
              ou
            </span>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          {/* Register link */}
          <div
            className="auth-fade-up text-center"
            style={{ animationDelay: "350ms" }}
          >
            <p className="font-body text-[0.875rem] text-muted-foreground">
              Ainda não tem conta?{" "}
              <Link
                href="/register"
                className="font-medium text-[#3da4ab] hover:text-[#2d8a91] dark:text-[#4dbdc4] dark:hover:text-[#5ccdd4] underline underline-offset-[3px] decoration-[#3da4ab]/25 hover:decoration-[#3da4ab]/60 transition-all duration-200"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* ── Error Dialog ── */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[380px] border-none shadow-[0_24px_64px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)] p-0 overflow-hidden gap-0 rounded-xl"
        >
          {/* Top accent gradient */}
          <div className="h-[3px] w-full bg-gradient-to-r from-red-500 via-rose-400 to-red-500" />

          <div className="px-7 pt-8 pb-3 flex flex-col items-center text-center">
            {/* Animated error icon */}
            <div className="relative mb-5">
              {/* Pulsing rings */}
              <div
                className="absolute inset-0 rounded-full bg-red-500/15"
                style={{
                  animation: "authPulseRing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                }}
              />
              <div
                className="absolute inset-0 rounded-full bg-red-500/10"
                style={{
                  animation:
                    "authPulseRing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                  animationDelay: "0.5s",
                }}
              />
              {/* Icon container */}
              <div className="relative w-[4.25rem] h-[4.25rem] rounded-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/40 dark:to-rose-900/20 flex items-center justify-center border border-red-200/40 dark:border-red-800/20 shadow-[0_0_20px_-4px_rgba(239,68,68,0.15)]">
                <ShieldAlert className="h-7 w-7 text-red-500 dark:text-red-400" />
              </div>
            </div>

            <DialogHeader className="space-y-2.5">
              <DialogTitle className="font-display text-[1.2rem] font-[500] tracking-[-0.01em]">
                Falha na autenticação
              </DialogTitle>
              <DialogDescription className="font-body text-[0.875rem] leading-relaxed text-muted-foreground max-w-[280px] mx-auto">
                {error}
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="px-7 pb-7 pt-3 sm:justify-center">
            <Button
              onClick={() => {
                setErrorDialogOpen(false);
                setError(null);
              }}
              className="w-full h-[2.5rem] font-body font-medium tracking-[0.01em] bg-[#0b3d40] hover:bg-[#154d50] dark:bg-[#3da4ab] dark:hover:bg-[#4dbdc4] dark:text-[#071f21] shadow-sm transition-all duration-200"
            >
              Tentar novamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
