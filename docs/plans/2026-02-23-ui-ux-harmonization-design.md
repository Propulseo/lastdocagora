# UI/UX Harmonization Design — Docagora

**Date:** 2026-02-23
**Status:** Approved
**Approach:** Bottom-Up Token System (Approach A)
**Architecture:** Shared components in `src/components/shared/`

---

## 1. Design Token Foundation

### 1.1 Spacing Scale

Added as CSS custom properties in `globals.css`. All interfaces unified to use the same spacing rules.

| Token | Value | Usage |
|-------|-------|-------|
| Page padding | `p-6` (24px) | Main content area across all interfaces |
| Section gap | `space-y-6` (24px) | Between page-level sections (unified from mixed 6/8) |
| Card internal | `space-y-4` (16px) | Between elements within a card |
| Card padding | `p-5` (20px) | Standardized card content padding |
| Grid gap (cards) | `gap-4` (16px) | Between cards in grid layouts |
| Grid gap (compact) | `gap-3` (12px) | Between items in tight lists |
| Filter gap | `gap-3` (12px) | Between filter elements |
| Button group gap | `gap-2` (8px) | Between buttons in a group |

### 1.2 Typography Scale

| Class | Specs | Usage |
|-------|-------|-------|
| `heading-page` | `text-2xl font-bold tracking-tight leading-tight` | Page titles |
| `heading-section` | `text-base font-semibold leading-snug` | Card titles, section headers |
| `heading-sub` | `text-sm font-semibold leading-snug` | Subsection headers |
| `text-body` | `text-sm leading-relaxed` | Body text (healthcare readability) |
| `text-caption` | `text-xs leading-normal text-muted-foreground` | Timestamps, metadata |
| `text-kpi` | `text-2xl font-bold tabular-nums tracking-tight` | KPI values |

Key: `leading-relaxed` (1.625) for body text improves readability in healthcare context.

### 1.3 Shadow & Elevation

```css
--shadow-card:  0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04);
--shadow-hover: 0 4px 12px 0 rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04);
--shadow-dialog: 0 8px 24px 0 rgb(0 0 0 / 0.12), 0 2px 8px -2px rgb(0 0 0 / 0.06);
```

- Cards at rest: `shadow-card`
- Interactive cards on hover: `shadow-hover`
- Dialogs/modals: `shadow-dialog`

### 1.4 Transition Tokens

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

- Interactive elements: `--transition-base` (200ms)
- Sidebar collapse: `--transition-slow` (300ms)
- Hover color changes: `--transition-fast` (150ms)

### 1.5 Icon Size Rules

| Context | Size | Example |
|---------|------|---------|
| Body inline | `size-4` (16px) | Search icon, table actions |
| Section headers | `size-5` (20px) | Card title icons |
| KPI icons | `size-5` (20px) | Inside 40px container |
| Empty states | `size-6` (24px) | Inside 48px container |

---

## 2. Shared Components

All placed in `src/components/shared/`.

### 2.1 PageHeader

Replaces: `AdminPageHeader`, patient inline headers, professional inline headers.

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}
```

Styling:
- Container: `flex items-start justify-between gap-4`
- Title: `text-2xl font-bold tracking-tight`
- Description: `text-sm text-muted-foreground leading-relaxed mt-1`
- Action: `shrink-0`

### 2.2 KPICard

Replaces: Admin inline KPI, professional colored KPI, patient quick-action.

```tsx
interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
  iconVariant?: "default" | "blue" | "green" | "amber" | "red";
}
```

Styling:
- Card: `p-5 rounded-xl border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-shadow duration-200`
- Layout: `flex items-center gap-4`
- Icon box: `size-10 rounded-full bg-primary/10 flex items-center justify-center`
- Icon: `size-5 text-primary`
- Label: `text-sm text-muted-foreground`
- Value: `text-2xl font-bold tabular-nums tracking-tight`
- Description: `text-xs text-muted-foreground`
- Trend indicator: green up arrow or red down arrow when provided

### 2.3 DataTable

Replaces: `AdminDataTable`, patient tables, professional tables.

```tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
}
```

Styling:
- Container: `rounded-xl border overflow-hidden`
- Header: `bg-muted/40`
- Row: `hover:bg-muted/50 transition-colors duration-150`
- Cell: `p-3 align-middle` (up from p-2)
- Separator: `border-border/40` (softer)
- Action column: `text-right`

### 2.4 EmptyState

Replaces: `AdminEmptyState`, patient dashed-card empty, professional inline empty.

```tsx
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
```

Styling:
- Container: `flex flex-col items-center justify-center py-12 text-center`
- Icon box: `size-12 rounded-full bg-muted flex items-center justify-center mb-4`
- Icon: `size-6 text-muted-foreground`
- Title: `text-sm font-semibold`
- Description: `text-sm text-muted-foreground max-w-sm mt-1`
- Action: `mt-4`

### 2.5 StatusBadge

Unified status-to-variant mapping for all interfaces.

```tsx
interface StatusBadgeProps {
  type: "userStatus" | "verification" | "appointment" | "payment" | "ticket" | "priority" | "content";
  value: string;
}
```

Same variant mappings as current `AdminStatusBadge` but shared.

### 2.6 SearchInput

Shared debounced search input (350ms). Same API as `AdminSearchInput`.

### 2.7 Pagination

Shared pagination component. Same API as `AdminPagination`.

### 2.8 ConfirmDialog

Shared confirmation dialog. Same API as `AdminConfirmDialog`.

---

## 3. shadcn/ui Component Overrides

### 3.1 Card

```
Base:    rounded-xl border shadow-[var(--shadow-card)]
Header:  px-5 pt-5 pb-0 gap-1.5
Content: px-5 pb-5 pt-4
Footer:  px-5 pb-5 pt-0
```

### 3.2 Button

```
Add:     transition-all duration-150
Hover:   existing + subtle transform scale
Active:  scale(0.98)
Disabled: opacity-40
```

### 3.3 Table

```
Header bg:    bg-muted/40
Row hover:    bg-muted/50 transition-colors duration-150
Cell padding: p-3
Separator:    border-border/40
```

### 3.4 Sidebar

```
Active item:  bg-sidebar-accent font-medium + left border indicator
Hover:        bg-sidebar-accent/50 transition-colors duration-150
Icon+text:    gap-3
Group label:  text-[11px] uppercase tracking-wider text-muted-foreground/70
```

---

## 4. Interface-Specific Refinements

### 4.1 Professional (Dark Blue Premium)

- KPI cards: colored icon backgrounds (`bg-blue-500/10 text-blue-400`)
- Card borders: `border-border/60` (softer on dark)
- Chart containers: `p-5` padding, `rounded-xl` corners
- Section dividers: `border-border/30` (very subtle on dark)

### 4.2 Patient (White Minimal)

- Body text: `leading-relaxed` everywhere
- Maximum whitespace: `space-y-6` between all sections
- Cards: minimal shadow (clean, not heavy)
- Key CTAs: slightly larger `h-10 px-6`
- Appointment cards: clear time-left / details-right hierarchy

### 4.3 Admin (Warm Institutional)

- Table headers: `bg-muted/40` background
- KPI grid: `lg:grid-cols-4` or `lg:grid-cols-5`
- Filter bar: `bg-muted/20 rounded-lg p-3` container
- Settings cards: clearer borders and grouping

---

## 5. Micro-Interactions & Accessibility

### Transitions

All interactive elements: `transition-[property] duration-200 ease-out`

Specific properties per component (not `transition-all`):
- Buttons: `transition-[background-color,border-color,color,transform]`
- Cards: `transition-[box-shadow]`
- Table rows: `transition-[background-color]`
- Sidebar items: `transition-[background-color,color]`

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus States

Keep existing `ring-[3px] ring-ring/50` — already meets WCAG 2.1 AA.

### Empty States

- Unified `EmptyState` component
- Always include action button when user can resolve the empty state
- Icon in `bg-muted` circle for visual weight

---

## 6. Performance Considerations

1. **Specific transition properties** — Replace all `transition-all` with targeted properties
2. **`will-change: transform`** — Only on sidebar collapse and dialog animations
3. **CSS containment** — `contain: content` on card grids
4. **No new JS** — All improvements are CSS/Tailwind only
5. **No new dependencies** — Everything uses existing shadcn/ui + Tailwind

---

## 7. Files to Create/Modify

### New Files
- `src/components/shared/page-header.tsx`
- `src/components/shared/kpi-card.tsx`
- `src/components/shared/data-table.tsx`
- `src/components/shared/empty-state.tsx`
- `src/components/shared/status-badge.tsx`
- `src/components/shared/search-input.tsx`
- `src/components/shared/pagination.tsx`
- `src/components/shared/confirm-dialog.tsx`

### Modified Files
- `src/app/globals.css` — Design tokens, typography classes, shadow system, transitions, reduced-motion
- `src/components/ui/card.tsx` — Updated padding/shadow
- `src/components/ui/button.tsx` — Transition improvements
- `src/components/ui/table.tsx` — Header bg, cell padding, row hover
- `src/components/ui/sidebar.tsx` — Active state, hover transitions, group labels
- `src/components/ui/skeleton.tsx` — Standardized shapes
- All admin page files — Import shared components
- All patient page files — Import shared components, fix spacing
- All professional page files — Import shared components, fix spacing to space-y-6

### Files to Remove (after migration)
- `src/app/(admin)/_components/admin-page-header.tsx` → replaced by shared
- `src/app/(admin)/_components/admin-data-table.tsx` → replaced by shared
- `src/app/(admin)/_components/admin-empty-state.tsx` → replaced by shared
- `src/app/(admin)/_components/admin-status-badge.tsx` → replaced by shared
- `src/app/(admin)/_components/admin-search-input.tsx` → replaced by shared
- `src/app/(admin)/_components/admin-pagination.tsx` → replaced by shared
- `src/app/(admin)/_components/admin-confirm-dialog.tsx` → replaced by shared

---

## 8. Constraints

- Do NOT change brand colors (role-specific CSS variable palettes stay untouched)
- Do NOT modify Supabase logic (auth, queries, middleware)
- Do NOT introduce mock data
- Do NOT break existing layout structure (route groups, sidebar model)
- All text remains in Portuguese
