# UI/UX Harmonization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harmonize UI/UX across all 3 Docagora interfaces (Admin, Patient, Professional) through a unified design token system and shared components, without changing brand colors or Supabase logic.

**Architecture:** Bottom-up approach: design tokens in `globals.css` -> shadcn component overrides -> shared components in `src/components/shared/` -> interface refactoring (admin -> patient -> professional).

**Tech Stack:** Next.js 16, Tailwind CSS v4, shadcn/ui (new-york), TypeScript, Lucide icons

**Design doc:** `docs/plans/2026-02-23-ui-ux-harmonization-design.md`

---

## Phase 1: Design Token Foundation

### Task 1: Add design tokens to globals.css

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add shadow, transition, and accessibility tokens**

Add these CSS custom properties inside `:root` (after line 85, before the closing `}`):

```css
  /* ─── Design System Tokens ─── */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04);
  --shadow-hover: 0 4px 12px 0 rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04);
  --shadow-dialog: 0 8px 24px 0 rgb(0 0 0 / 0.12), 0 2px 8px -2px rgb(0 0 0 / 0.06);
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Step 2: Add reduced-motion support and base layer improvements**

Replace the existing `@layer base` block at end of file with:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* ─── Reduced Motion ─── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add design system tokens (shadows, transitions, reduced-motion)"
```

---

## Phase 2: shadcn/ui Component Overrides

### Task 2: Update Card component

**Files:**
- Modify: `src/components/ui/card.tsx`

**Step 1: Update Card base styling**

In `card.tsx`, change the Card className from:
```
"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
```
to:
```
"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-[var(--shadow-card)]"
```

**Step 2: Update CardHeader padding**

Change CardHeader className from:
```
"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
```
to:
```
"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
```

**Step 3: Update CardContent padding**

Change CardContent className from `"px-6"` to `"px-5"`.

**Step 4: Update CardFooter padding**

Change CardFooter className from:
```
"flex items-center px-6 [.border-t]:pt-6"
```
to:
```
"flex items-center px-5 [.border-t]:pt-6"
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: update Card component with design token shadows and normalized padding"
```

### Task 3: Update Button component

**Files:**
- Modify: `src/components/ui/button.tsx`

**Step 1: Improve button transitions and disabled state**

In `button.tsx`, update the base CVA string from:
```
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
```
to:
```
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--transition-fast)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
```

Changes:
- `transition-all` → `transition-[background-color,border-color,color,box-shadow,transform]` (performance)
- Added `duration-[var(--transition-fast)]` (150ms)
- Added `active:scale-[0.98]` (press feedback)
- `disabled:opacity-50` → `disabled:opacity-40` (clearer disabled state)

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: improve Button transitions, active state, and disabled opacity"
```

### Task 4: Update Table component

**Files:**
- Modify: `src/components/ui/table.tsx`

**Step 1: Add header background and improve cell padding**

In `table.tsx`, make these changes:

1. `TableHeader` — add subtle background. Change className from:
```
"[&_tr]:border-b"
```
to:
```
"bg-muted/40 [&_tr]:border-b"
```

2. `TableRow` — improve hover transition. Change className from:
```
"hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
```
to:
```
"hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-border/40 transition-[background-color] duration-[var(--transition-fast)]"
```

3. `TableHead` — increase padding. Change `px-2` to `px-3` in the className:
```
"text-foreground h-10 px-3 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
```

4. `TableCell` — increase padding. Change `p-2` to `p-3` in the className:
```
"p-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/ui/table.tsx
git commit -m "feat: improve Table readability with header bg, softer borders, and better padding"
```

### Task 5: Update Sidebar component

**Files:**
- Modify: `src/components/ui/sidebar.tsx`

**Step 1: Improve sidebar menu button styling**

In `sidebar.tsx` at line 476, update the `sidebarMenuButtonVariants` base string.

Change the base class string from:
```
"peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0"
```
to:
```
"peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[background-color,color,width,height,padding] duration-[var(--transition-fast)] hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0"
```

Changes:
- `gap-2` → `gap-3` (better icon+text alignment)
- `transition-[width,height,padding]` → `transition-[background-color,color,width,height,padding] duration-[var(--transition-fast)]` (smooth hover)
- `hover:bg-sidebar-accent` → `hover:bg-sidebar-accent/50` (softer hover, less heavy)

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/ui/sidebar.tsx
git commit -m "feat: improve sidebar hover transitions, icon gap, and active state"
```

---

## Phase 3: Shared Components

### Task 6: Create shared PageHeader component

**Files:**
- Create: `src/components/shared/page-header.tsx`

**Step 1: Create the component**

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/shared/page-header.tsx
git commit -m "feat: create shared PageHeader component"
```

### Task 7: Create shared KPICard component

**Files:**
- Create: `src/components/shared/kpi-card.tsx`

**Step 1: Create the component**

```tsx
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-500",
  green: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  red: "bg-red-500/10 text-red-500",
} as const;

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
  iconVariant?: keyof typeof iconVariantStyles;
  className?: string;
}

export function KPICard({
  icon: Icon,
  label,
  value,
  description,
  trend,
  iconVariant = "default",
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-xl border p-5 shadow-[var(--shadow-card)] transition-[box-shadow] duration-[var(--transition-base)] hover:shadow-[var(--shadow-hover)]",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            iconVariantStyles[iconVariant]
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-sm">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {value}
            </p>
            {trend && trend !== "neutral" && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  trend === "up" && "text-emerald-600",
                  trend === "down" && "text-red-600"
                )}
              >
                {trend === "up" ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
              </span>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/shared/kpi-card.tsx
git commit -m "feat: create shared KPICard component with icon variants and trends"
```

### Task 8: Create shared EmptyState component

**Files:**
- Create: `src/components/shared/empty-state.tsx`

**Step 1: Create the component**

```tsx
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-6" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/shared/empty-state.tsx
git commit -m "feat: create shared EmptyState component"
```

### Task 9: Create shared StatusBadge component

**Files:**
- Create: `src/components/shared/status-badge.tsx`

**Step 1: Create the component**

Copy exact logic from `src/app/(admin)/_components/admin-status-badge.tsx` but in shared location:

```tsx
import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const statusConfig: Record<
  string,
  Record<string, { label: string; variant: BadgeVariant }>
> = {
  userStatus: {
    active: { label: "Ativo", variant: "default" },
    inactive: { label: "Inativo", variant: "secondary" },
    suspended: { label: "Suspenso", variant: "destructive" },
  },
  role: {
    patient: { label: "Paciente", variant: "outline" },
    professional: { label: "Profissional", variant: "outline" },
    admin: { label: "Administrador", variant: "secondary" },
  },
  verification: {
    verified: { label: "Verificado", variant: "default" },
    pending: { label: "Pendente", variant: "outline" },
    rejected: { label: "Rejeitado", variant: "destructive" },
  },
  appointment: {
    scheduled: { label: "Agendada", variant: "outline" },
    confirmed: { label: "Confirmada", variant: "default" },
    completed: { label: "Concluida", variant: "secondary" },
    cancelled: { label: "Cancelada", variant: "destructive" },
    no_show: { label: "Falta", variant: "destructive" },
  },
  payment: {
    pending: { label: "Pendente", variant: "outline" },
    paid: { label: "Pago", variant: "default" },
    refunded: { label: "Reembolsado", variant: "secondary" },
    failed: { label: "Falhado", variant: "destructive" },
  },
  ticket: {
    open: { label: "Aberto", variant: "destructive" },
    in_progress: { label: "Em progresso", variant: "outline" },
    resolved: { label: "Resolvido", variant: "default" },
    closed: { label: "Fechado", variant: "secondary" },
  },
  priority: {
    low: { label: "Baixa", variant: "secondary" },
    medium: { label: "Media", variant: "outline" },
    high: { label: "Alta", variant: "default" },
    urgent: { label: "Urgente", variant: "destructive" },
  },
  published: {
    true: { label: "Publicado", variant: "default" },
    false: { label: "Rascunho", variant: "secondary" },
  },
};

interface StatusBadgeProps {
  type: keyof typeof statusConfig;
  value: string | boolean | null | undefined;
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  const strValue = String(value ?? "");
  const config = statusConfig[type]?.[strValue];
  return (
    <Badge variant={config?.variant ?? "outline"}>
      {config?.label ?? strValue}
    </Badge>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/shared/status-badge.tsx
git commit -m "feat: create shared StatusBadge component"
```

### Task 10: Create shared SearchInput component

**Files:**
- Create: `src/components/shared/search-input.tsx`

**Step 1: Create the component**

Copy exact logic from `src/app/(admin)/_components/admin-search-input.tsx` but in shared location:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  paramKey?: string;
}

export function SearchInput({
  placeholder = "Pesquisar...",
  paramKey = "search",
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
      if (newValue.trim()) {
        params.set(paramKey, newValue.trim());
      } else {
        params.delete(paramKey);
      }
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 350);
  }

  return (
    <div className="relative max-w-xs">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/shared/search-input.tsx
git commit -m "feat: create shared SearchInput component"
```

### Task 11: Create shared Pagination component

**Files:**
- Create: `src/components/shared/pagination.tsx`

**Step 1: Create the component**

Copy exact logic from `src/app/(admin)/_components/admin-pagination.tsx` but in shared location:

```tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  total: number;
  pageSize: number;
}

export function Pagination({ total, pageSize }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (total <= pageSize) return null;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-muted-foreground text-sm">
        Mostrando {from} a {to} de {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
          aria-label="Pagina anterior"
        >
          {currentPage > 1 ? (
            <Link href={buildHref(currentPage - 1)}>
              <ChevronLeft className="size-4" />
              Anterior
            </Link>
          ) : (
            <span>
              <ChevronLeft className="size-4" />
              Anterior
            </span>
          )}
        </Button>
        <span className="text-sm tabular-nums">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
          aria-label="Proxima pagina"
        >
          {currentPage < totalPages ? (
            <Link href={buildHref(currentPage + 1)}>
              Seguinte
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span>
              Seguinte
              <ChevronRight className="size-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/shared/pagination.tsx
git commit -m "feat: create shared Pagination component"
```

### Task 12: Create shared ConfirmDialog component

**Files:**
- Create: `src/components/shared/confirm-dialog.tsx`

**Step 1: Create the component**

Copy exact logic from `src/app/(admin)/_components/admin-confirm-dialog.tsx` but in shared location:

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  variant = "default",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "A processar..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/shared/confirm-dialog.tsx
git commit -m "feat: create shared ConfirmDialog component"
```

### Task 13: Create shared DataTable component

**Files:**
- Create: `src/components/shared/data-table.tsx`

**Step 1: Create the component**

Based on `AdminDataTable` but with improved styling:

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./empty-state";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyTitle = "Nenhum resultado encontrado",
  emptyDescription = "Tente ajustar os filtros de pesquisa.",
  emptyAction,
  onRowClick,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} scope="col" className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={rowKey(row)}
              className={onRowClick ? "cursor-pointer" : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/shared/data-table.tsx
git commit -m "feat: create shared DataTable component with improved styling"
```

---

## Phase 4: Migrate Admin Interface

### Task 14: Migrate admin page imports to shared components

**Files:**
- Modify: `src/app/(admin)/admin/dashboard/page.tsx`
- Modify: `src/app/(admin)/admin/users/page.tsx`
- Modify: `src/app/(admin)/admin/professionals/page.tsx`
- Modify: `src/app/(admin)/admin/appointments/page.tsx`
- Modify: `src/app/(admin)/admin/support/page.tsx`
- Modify: `src/app/(admin)/admin/content/page.tsx`
- Modify: `src/app/(admin)/admin/settings/page.tsx`

**Step 1: Update imports in all admin pages**

For every admin page file that imports from `@/app/(admin)/_components/admin-page-header`, change:
```tsx
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
```
to:
```tsx
import { PageHeader } from "@/components/shared/page-header";
```

And rename all `<AdminPageHeader` to `<PageHeader` in JSX.

Files affected: `dashboard/page.tsx`, `users/page.tsx`, `professionals/page.tsx`, `appointments/page.tsx`, `support/page.tsx`, `content/page.tsx`, `settings/page.tsx`

**Step 2: Update AdminPagination imports**

For every admin page file that imports `AdminPagination`, change:
```tsx
import { AdminPagination } from "@/app/(admin)/_components/admin-pagination";
```
to:
```tsx
import { Pagination } from "@/components/shared/pagination";
```

And rename all `<AdminPagination` to `<Pagination` in JSX.

Files affected: `users/page.tsx`, `professionals/page.tsx`, `appointments/page.tsx`, `support/page.tsx`

**Step 3: Update AdminEmptyState imports**

For every file that imports `AdminEmptyState`, change to shared `EmptyState`:
```tsx
import { EmptyState } from "@/components/shared/empty-state";
```

Files affected: `settings/page.tsx`, `support/page.tsx`, `content/_components/content-tabs.tsx`

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds (all pages still work with shared components).

**Step 5: Commit**

```bash
git add src/app/(admin)/
git commit -m "refactor: migrate admin pages to shared PageHeader, Pagination, EmptyState"
```

### Task 15: Migrate admin sub-component imports

**Files:**
- Modify: `src/app/(admin)/admin/users/_components/users-table.tsx`
- Modify: `src/app/(admin)/admin/users/_components/users-filters.tsx`
- Modify: `src/app/(admin)/admin/professionals/_components/professionals-table.tsx`
- Modify: `src/app/(admin)/admin/professionals/_components/professionals-filters.tsx`
- Modify: `src/app/(admin)/admin/appointments/_components/appointments-table.tsx`
- Modify: `src/app/(admin)/admin/appointments/_components/appointments-filters.tsx`
- Modify: `src/app/(admin)/admin/support/_components/ticket-row.tsx`
- Modify: `src/app/(admin)/admin/support/_components/support-filters.tsx`
- Modify: `src/app/(admin)/admin/dashboard/_components/top-professionals-table.tsx`
- Modify: `src/app/(admin)/admin/settings/_components/settings-form.tsx`

**Step 1: Migrate DataTable imports**

In files that import `AdminDataTable`, change:
```tsx
import { AdminDataTable, type ColumnDef } from "@/app/(admin)/_components/admin-data-table";
```
to:
```tsx
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
```

And rename `<AdminDataTable` to `<DataTable` in JSX.

Files: `users-table.tsx`, `professionals-table.tsx`, `appointments-table.tsx`, `top-professionals-table.tsx`

**Step 2: Migrate StatusBadge imports**

In files that import `AdminStatusBadge`, change:
```tsx
import { AdminStatusBadge } from "@/app/(admin)/_components/admin-status-badge";
```
to:
```tsx
import { StatusBadge } from "@/components/shared/status-badge";
```

And rename `<AdminStatusBadge` to `<StatusBadge` in JSX.

Files: `users-table.tsx`, `professionals-table.tsx`, `appointments-table.tsx`, `ticket-row.tsx`

**Step 3: Migrate SearchInput imports**

In files that import `AdminSearchInput`, change:
```tsx
import { AdminSearchInput } from "@/app/(admin)/_components/admin-search-input";
```
to:
```tsx
import { SearchInput } from "@/components/shared/search-input";
```

And rename `<AdminSearchInput` to `<SearchInput` in JSX.

Files: `users-filters.tsx`, `professionals-filters.tsx`, `appointments-filters.tsx`, `support-filters.tsx`

**Step 4: Migrate ConfirmDialog imports**

In files that import `AdminConfirmDialog`, change:
```tsx
import { AdminConfirmDialog } from "@/app/(admin)/_components/admin-confirm-dialog";
```
to:
```tsx
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
```

And rename `<AdminConfirmDialog` to `<ConfirmDialog` in JSX.

Files: `users-table.tsx`, `professionals-table.tsx`, `settings-form.tsx`

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds — all admin pages work with shared components.

**Step 6: Commit**

```bash
git add src/app/(admin)/
git commit -m "refactor: migrate all admin sub-components to shared DataTable, StatusBadge, SearchInput, ConfirmDialog"
```

### Task 16: Delete deprecated admin-specific components

**Files:**
- Delete: `src/app/(admin)/_components/admin-page-header.tsx`
- Delete: `src/app/(admin)/_components/admin-data-table.tsx`
- Delete: `src/app/(admin)/_components/admin-empty-state.tsx`
- Delete: `src/app/(admin)/_components/admin-status-badge.tsx`
- Delete: `src/app/(admin)/_components/admin-search-input.tsx`
- Delete: `src/app/(admin)/_components/admin-pagination.tsx`
- Delete: `src/app/(admin)/_components/admin-confirm-dialog.tsx`

**Step 1: Delete the files**

```bash
rm src/app/\(admin\)/_components/admin-page-header.tsx
rm src/app/\(admin\)/_components/admin-data-table.tsx
rm src/app/\(admin\)/_components/admin-empty-state.tsx
rm src/app/\(admin\)/_components/admin-status-badge.tsx
rm src/app/\(admin\)/_components/admin-search-input.tsx
rm src/app/\(admin\)/_components/admin-pagination.tsx
rm src/app/\(admin\)/_components/admin-confirm-dialog.tsx
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds — no remaining imports to deleted files.

**Step 3: Commit**

```bash
git add -A src/app/(admin)/_components/
git commit -m "refactor: remove deprecated admin-specific components (now shared)"
```

---

## Phase 5: Migrate Patient Interface

### Task 17: Fix patient interface spacing and adopt shared components

**Files:**
- Modify: All files in `src/app/(patient)/` that have page headers or spacing

**Step 1: Scan for inline page headers and replace with shared PageHeader**

In every patient page that has an inline `<h1 className="text-2xl font-bold tracking-tight">` pattern, replace with:
```tsx
import { PageHeader } from "@/components/shared/page-header";
```

**Step 2: Fix spacing inconsistencies**

- Ensure all patient pages use `space-y-6` between page-level sections (not `space-y-8` or other values)
- Ensure patient dashboard card grids use `gap-4` consistently

**Step 3: Adopt shared EmptyState where patient uses dashed-border empty states**

Replace dashed-card empty patterns with:
```tsx
import { EmptyState } from "@/components/shared/empty-state";
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/app/(patient)/
git commit -m "refactor: harmonize patient interface with shared components and unified spacing"
```

---

## Phase 6: Migrate Professional Interface

### Task 18: Fix professional interface spacing and adopt shared components

**Files:**
- Modify: All files in `src/app/(professional)/` that have page headers or spacing

**Step 1: Change space-y-8 to space-y-6**

The professional interface uses `space-y-8` in several places. Search for all `space-y-8` and change to `space-y-6` for consistency.

**Step 2: Adopt shared PageHeader**

Replace inline h1/p title blocks with:
```tsx
import { PageHeader } from "@/components/shared/page-header";
```

**Step 3: Adopt shared StatusBadge where professional uses inline badge mappings**

Replace inline badge variant mappings with:
```tsx
import { StatusBadge } from "@/components/shared/status-badge";
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/app/(professional)/
git commit -m "refactor: harmonize professional interface with shared components and space-y-6"
```

---

## Phase 7: Interface-Specific Polish

### Task 19: Professional dark theme polish

**Files:**
- Modify: Professional dashboard and layout files

**Step 1: Soften card borders for dark theme**

In professional-specific components, where cards are used, ensure borders use `border-border/60` for softer appearance on dark background. This can be done by adding a utility class in the professional layout or in `globals.css`:

Add to `globals.css` inside the `body.role-professional` block:
```css
  --border: oklch(1 0 0 / 8%);
```

Wait — this is a color change. Instead, apply `border-border/60` to professional-specific card wrappers where appropriate.

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/(professional)/ src/app/globals.css
git commit -m "feat: polish professional dark theme card borders and section dividers"
```

### Task 20: Admin filter bar grouping

**Files:**
- Modify: Admin filter components

**Step 1: Wrap filter sections in a visual container**

In the admin filter components (`users-filters.tsx`, `professionals-filters.tsx`, `appointments-filters.tsx`, `support-filters.tsx`), wrap the filter flex container with:
```tsx
<div className="bg-muted/20 rounded-lg p-3">
  <div className="flex flex-wrap items-center gap-3">
    {/* existing filter content */}
  </div>
</div>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/(admin)/
git commit -m "feat: add visual grouping to admin filter bars"
```

---

## Phase 8: Final Verification

### Task 21: Full build and lint check

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with 0 errors.

**Step 2: Run lint**

Run: `npm run lint`
Expected: No new lint errors introduced.

**Step 3: Visual spot check**

Start dev server and verify:
- Admin dashboard: cards have subtle shadows, hover elevation works
- Patient interface: consistent spacing, shared components work
- Professional interface: space-y-6 throughout, dark theme polished
- Sidebar: smooth hover transitions across all interfaces
- Tables: header background visible, softer row separators
- Buttons: press feedback (scale 0.98), improved disabled state
- Empty states: unified icon-in-circle pattern

Run: `npm run dev`

**Step 4: Final commit if any tweaks needed**

```bash
git add -A
git commit -m "feat: complete UI/UX harmonization across all interfaces"
```

---

## Summary: Commit History

1. `feat: add design system tokens (shadows, transitions, reduced-motion)`
2. `feat: update Card component with design token shadows and normalized padding`
3. `feat: improve Button transitions, active state, and disabled opacity`
4. `feat: improve Table readability with header bg, softer borders, and better padding`
5. `feat: improve sidebar hover transitions, icon gap, and active state`
6. `feat: create shared PageHeader component`
7. `feat: create shared KPICard component with icon variants and trends`
8. `feat: create shared EmptyState component`
9. `feat: create shared StatusBadge component`
10. `feat: create shared SearchInput component`
11. `feat: create shared Pagination component`
12. `feat: create shared ConfirmDialog component`
13. `feat: create shared DataTable component with improved styling`
14. `refactor: migrate admin pages to shared PageHeader, Pagination, EmptyState`
15. `refactor: migrate all admin sub-components to shared DataTable, StatusBadge, SearchInput, ConfirmDialog`
16. `refactor: remove deprecated admin-specific components (now shared)`
17. `refactor: harmonize patient interface with shared components and unified spacing`
18. `refactor: harmonize professional interface with shared components and space-y-6`
19. `feat: polish professional dark theme card borders and section dividers`
20. `feat: add visual grouping to admin filter bars`
21. `feat: complete UI/UX harmonization across all interfaces`
