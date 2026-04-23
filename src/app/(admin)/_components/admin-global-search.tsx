"use client";

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Search, X } from "lucide-react";
import { getAdminSearchResults } from "@/app/(admin)/_actions/admin-crud-actions";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string | null;
  avatar_url: string | null;
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
  const inputRef = useRef<HTMLInputElement>(null);

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
    router.push(
      `/admin/users?search=${encodeURIComponent(userId.slice(-5))}`
    );
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t.common.globalSearch}
          className={cn(
            "h-8 w-full rounded-md border border-border bg-background pl-8 pr-14 text-sm",
            "placeholder:text-muted-foreground/40",
            "outline-none transition-colors duration-100",
            "focus:border-foreground/20 focus:ring-1 focus:ring-foreground/5"
          )}
        />
        {query ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors hover:bg-accent"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50 sm:inline-flex">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
            {t.common.globalSearchResults}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {results.map((r) => {
              const fullName = `${r.first_name} ${r.last_name}`;
              const initials =
                (r.first_name?.[0] ?? "") + (r.last_name?.[0] ?? "");
              return (
                <button
                  key={r.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-100 hover:bg-accent/50"
                  onClick={() => handleSelect(r.id)}
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.email}
                    </p>
                  </div>
                  <StatusBadge
                    type="role"
                    value={r.role}
                    labels={t.statuses.role}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover p-3 text-center text-sm text-muted-foreground shadow-md">
          {t.common.noSearchResults}
        </div>
      )}
    </div>
  );
}
