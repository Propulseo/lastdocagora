"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"patient" | "professional">("patient");
  const [error, setError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }, []);

  function validate(): string | null {
    if (!firstName.trim()) return "O nome é obrigatório.";
    if (!lastName.trim()) return "O apelido é obrigatório.";
    if (!email.trim()) return "O email é obrigatório.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Introduza um endereço de email válido.";
    if (!password) return "A palavra-passe é obrigatória.";
    if (password.length < 6)
      return "A palavra-passe deve ter pelo menos 6 caracteres.";
    return null;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setErrorDialogOpen(true);
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
          },
        },
      });

      if (error) {
        setError(error.message);
        setErrorDialogOpen(true);
        triggerShake();
        setLoading(false);
        return;
      }

      if (role === "professional") {
        router.push("/pro/dashboard");
      } else {
        router.push("/patient/dashboard");
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

  const inputClasses =
    "h-[2.75rem] font-body bg-muted/40 border-border/50 placeholder:text-muted-foreground/35 focus-visible:ring-[#3da4ab]/25 focus-visible:border-[#3da4ab]/50 transition-all duration-200";

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
            Criar a sua conta
          </h2>
          <p className="mt-2 font-body text-[0.95rem] text-muted-foreground">
            Junte-se à plataforma médica DOCAGORA
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleRegister} noValidate className="space-y-5">
          {/* Role select */}
          <div
            className="space-y-2.5 auth-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            <Label className="font-body text-[0.825rem] font-medium">
              Tipo de conta
            </Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "patient" | "professional")}
            >
              <SelectTrigger className={inputClasses}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Paciente</SelectItem>
                <SelectItem value="professional">
                  Profissional de saúde
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Name fields */}
          <div
            className="grid grid-cols-2 gap-3 auth-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className="space-y-2.5">
              <Label
                htmlFor="firstName"
                className="font-body text-[0.825rem] font-medium"
              >
                Nome
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                autoComplete="given-name"
                className={inputClasses}
              />
            </div>
            <div className="space-y-2.5">
              <Label
                htmlFor="lastName"
                className="font-body text-[0.825rem] font-medium"
              >
                Apelido
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                autoComplete="family-name"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Email */}
          <div
            className="space-y-2.5 auth-fade-up"
            style={{ animationDelay: "180ms" }}
          >
            <Label
              htmlFor="reg-email"
              className="font-body text-[0.825rem] font-medium"
            >
              Endereço de email
            </Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="nome@exemplo.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              className={inputClasses}
            />
          </div>

          {/* Password */}
          <div
            className="space-y-2.5 auth-fade-up"
            style={{ animationDelay: "240ms" }}
          >
            <Label
              htmlFor="reg-password"
              className="font-body text-[0.825rem] font-medium"
            >
              Palavra-passe
            </Label>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className={`${inputClasses} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/80 transition-colors duration-200"
                aria-label={
                  showPassword
                    ? "Ocultar palavra-passe"
                    : "Mostrar palavra-passe"
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
            style={{ animationDelay: "300ms" }}
          >
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-[2.75rem] font-body font-medium tracking-[0.01em] bg-[#0b3d40] hover:bg-[#154d50] active:bg-[#0a3235] dark:bg-[#3da4ab] dark:hover:bg-[#4dbdc4] dark:active:bg-[#349a9f] dark:text-[#071f21] shadow-sm transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Criar conta
            </Button>
          </div>

          {/* Divider */}
          <div
            className="auth-fade-up flex items-center gap-4 py-1"
            style={{ animationDelay: "360ms" }}
          >
            <div className="h-px flex-1 bg-border/50" />
            <span className="font-body text-[0.7rem] tracking-widest uppercase text-muted-foreground/40">
              ou
            </span>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          {/* Login link */}
          <div
            className="auth-fade-up text-center"
            style={{ animationDelay: "420ms" }}
          >
            <p className="font-body text-[0.875rem] text-muted-foreground">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="font-medium text-[#3da4ab] hover:text-[#2d8a91] dark:text-[#4dbdc4] dark:hover:text-[#5ccdd4] underline underline-offset-[3px] decoration-[#3da4ab]/25 hover:decoration-[#3da4ab]/60 transition-all duration-200"
              >
                Iniciar sessão
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
          <div className="h-[3px] w-full bg-gradient-to-r from-red-500 via-rose-400 to-red-500" />

          <div className="px-7 pt-8 pb-3 flex flex-col items-center text-center">
            <div className="relative mb-5">
              <div
                className="absolute inset-0 rounded-full bg-red-500/15"
                style={{
                  animation:
                    "authPulseRing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
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
              <div className="relative w-[4.25rem] h-[4.25rem] rounded-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/40 dark:to-rose-900/20 flex items-center justify-center border border-red-200/40 dark:border-red-800/20 shadow-[0_0_20px_-4px_rgba(239,68,68,0.15)]">
                <ShieldAlert className="h-7 w-7 text-red-500 dark:text-red-400" />
              </div>
            </div>

            <DialogHeader className="space-y-2.5">
              <DialogTitle className="font-display text-[1.2rem] font-[500] tracking-[-0.01em]">
                Erro no registo
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
