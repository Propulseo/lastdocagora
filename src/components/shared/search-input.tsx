"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  paramKey?: string;
  className?: string;
  /** Minimum characters before triggering URL search (default: 1) */
  minLength?: number;
}

export function SearchInput({
  placeholder = "",
  paramKey = "search",
  className,
  minLength = 1,
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramKey) ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(newValue: string) {
    setValue(newValue);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = newValue.trim();
      if (trimmed && trimmed.length >= minLength) {
        params.set(paramKey, trimmed);
      } else {
        params.delete(paramKey);
      }
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 350);
  }

  return (
    <div className={className ?? "relative w-full sm:max-w-xs group/search"}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 transition-colors duration-150 group-focus-within/search:text-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9 transition-shadow duration-150"
        aria-label={placeholder}
      />
    </div>
  );
}
