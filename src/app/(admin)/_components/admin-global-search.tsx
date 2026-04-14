"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Search, X } from "lucide-react";
import { getAdminSearchResults } from "@/app/(admin)/_actions/admin-crud-actions";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface SearchResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string | null;
  avatar_url: string | null;
}

const AVATAR_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

function getColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function AdminGlobalSearch() {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback((q: string) => {
    startTransition(async () => {
      const res = await getAdminSearchResults(q);
      if (res.success) {
        setResults(res.data as SearchResult[]);
        setOpen(true);
      }
    });
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(() => doSearch(value), 300);
  }

  function handleSelect(userId: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/admin/users?search=${encodeURIComponent(userId.slice(-5))}`);
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t.common.globalSearch}
          className="pl-9 pr-8 h-10"
        />
        {query && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-sm hover:bg-accent"
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2 text-xs font-medium text-muted-foreground">
            {t.common.globalSearchResults}
          </div>
          {results.map((r) => {
            const fullName = `${r.first_name} ${r.last_name}`;
            const bg = getColor(fullName);
            return (
              <button
                key={r.id}
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 hover:bg-accent text-left transition-colors"
                onClick={() => handleSelect(r.id)}
              >
                <Avatar className="size-8">
                  <AvatarFallback style={{ backgroundColor: bg, color: "white" }} className="text-[11px] font-semibold">
                    {r.first_name?.[0] ?? ""}{r.last_name?.[0] ?? ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge type="role" value={r.role} labels={t.statuses.role} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg p-4 text-center text-sm text-muted-foreground">
          {t.common.noSearchResults}
        </div>
      )}
    </div>
  );
}
