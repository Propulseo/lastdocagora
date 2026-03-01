"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Shield, Stethoscope, User } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    label: "Admin",
    email: "contact@docagora.com",
    icon: Shield,
    color: "bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200",
  },
  {
    label: "Profissional",
    email: "pro@docagora.com",
    icon: Stethoscope,
    color: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200",
  },
  {
    label: "Paciente",
    email: "patient@docagora.com",
    icon: User,
    color: "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200",
  },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);

  async function loginWith(loginEmail: string, loginPassword: string) {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      setLoadingDemo(null);
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
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await loginWith(email, password);
  }

  async function handleDemoLogin(demoEmail: string) {
    setLoadingDemo(demoEmail);
    await loginWith(demoEmail, "Password");
  }

  const isLoading = loading || !!loadingDemo;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">DOCAGORA</CardTitle>
          <CardDescription>Inicie sessão na sua conta</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Palavra-passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {loading && !loadingDemo && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Entrar
            </Button>
            <p className="text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link href="/register" className="text-primary underline">
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription className="text-center">
            Acesso rápido — Contas de demonstração
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              variant="outline"
              className={`w-full justify-start gap-3 border ${account.color}`}
              disabled={isLoading}
              onClick={() => handleDemoLogin(account.email)}
            >
              {loadingDemo === account.email ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <account.icon className="h-4 w-4" />
              )}
              <span className="font-medium">{account.label}</span>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <span className="text-xs opacity-70">{account.email}</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
