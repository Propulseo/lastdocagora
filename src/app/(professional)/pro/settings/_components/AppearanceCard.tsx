"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Sun, Moon, Monitor } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

export function AppearanceCard() {
  const { t } = useProfessionalI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const themeOptions = [
    { value: "light", label: t.settings.themeLight, icon: Sun },
    { value: "dark", label: t.settings.themeDark, icon: Moon },
    { value: "system", label: t.settings.themeSystem, icon: Monitor },
  ] as const;

  return (
    <Card className={`${RADIUS.card} ${SHADOW.card}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-5" />
          {t.settings.appearance}
        </CardTitle>
        <CardDescription>{t.settings.appearanceDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{t.settings.theme}</p>
            <p className="text-xs text-muted-foreground">
              {t.settings.themeDesc}
            </p>
          </div>
          {mounted && (
            <div className={`flex gap-1 ${RADIUS.sm} border p-1`}>
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.value;
                return (
                  <Button
                    key={opt.value}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setTheme(opt.value)}
                  >
                    <Icon className="size-3.5" />
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
