// ─── DocAgora Professional Design System Tokens ───
// Apply uniformly across the professional interface.
// DO NOT MODIFY — consume these tokens in component classNames.

export const SPACING = {
  section: "py-8",
  card: "p-6",
  card_sm: "p-4",
  stack: "space-y-4",
  stack_sm: "space-y-2",
  inline: "gap-3",
} as const;

export const SHADOW = {
  card: "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]",
  card_hover: "shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
  card_elevated: "shadow-lg",
  subtle: "shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
} as const;

export const RADIUS = {
  card: "rounded-2xl",
  element: "rounded-xl",
  badge: "rounded-full",
  sm: "rounded-lg",
} as const;

export const TYPE = {
  page_title: "text-2xl font-bold tracking-tight",
  section_title: "text-lg font-semibold",
  card_title: "text-base font-semibold",
  label: "text-sm font-medium text-muted-foreground",
  body: "text-sm text-muted-foreground leading-relaxed",
  caption: "text-xs text-muted-foreground/60",
  kpi_number: "text-3xl font-bold tracking-tight",
} as const;
