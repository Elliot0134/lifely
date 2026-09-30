// Shared look & motion of the main sidebar (ported from Aurentia's sidebar).

/** Single row template: universe rows, leaves and global links all use it. */
export const SIDEBAR_ROW_CLASS =
  "flex w-full items-center gap-2 rounded-md px-2 h-9 text-sm text-sidebar-foreground/90 transition-colors duration-150 motion-reduce:transition-none hover:bg-sidebar-accent hover:text-sidebar-foreground"

/** Icon button of the collapsed rail. */
export const RAIL_BUTTON_CLASS =
  "relative flex size-9 items-center justify-center rounded-lg transition-colors duration-150 motion-reduce:transition-none hover:bg-sidebar-accent hover:text-sidebar-foreground"

/** Square icon button of the column footer (account, collapse). */
export const FOOTER_BUTTON_CLASS =
  "flex size-10 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"

/** Indent of the leaves under an open universe: the line sits under the parent icon centre. */
export const LEAF_INDENT_CLASS = "ml-[18px] border-l border-sidebar-border/60 pl-2"

export const RAIL_WIDTH_PX = 56
export const COLUMN_WIDTH_PX = 256

export const SIDEBAR_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1]
export const SIDEBAR_DURATION_S = 0.24

/** Active background tinted with the universe colour. */
export function tintedActiveBackground(color: string): string {
  return `color-mix(in oklab, ${color} 14%, var(--sidebar-accent))`
}
