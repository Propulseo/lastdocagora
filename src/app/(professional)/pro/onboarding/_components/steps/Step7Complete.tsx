"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { completeOnboarding } from "../../_actions/onboarding-actions";

export function Step7Complete() {
  const { t } = useProfessionalI18n();
  const ob = t.onboarding;
  const router = useRouter();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    completeOnboarding();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
      <div className="animate-in zoom-in-50 duration-500">
        <CheckCircle className="size-20 text-green-500" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{ob.step7.title}</h2>
        <p className="text-muted-foreground">{ob.step7.subtitle}</p>
      </div>
      <p className="max-w-md text-sm text-muted-foreground">{ob.step7.message}</p>
      <Button size="lg" onClick={() => router.push("/pro/dashboard")}>
        {ob.step7.goToDashboard}
      </Button>
    </div>
  );
}
