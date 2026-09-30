"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ChevronRight, PanelLeftClose } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  NAV_ASSISTANT,
  NAV_FOOTER_LEAVES,
  NAV_UNIVERSES,
  isNavLeafActive,
  type NavLeaf,
  type NavUniverse,
} from "@/config/navigation"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SidebarUserMenu, type SidebarUser } from "@/components/sidebar/sidebar-user-menu"
import { UniverseLeafList } from "@/components/sidebar/universe-leaf-list"
import {
  FOOTER_BUTTON_CLASS,
  LEAF_INDENT_CLASS,
  SIDEBAR_DURATION_S,
  SIDEBAR_EASE,
  SIDEBAR_ROW_CLASS,
  tintedActiveBackground,
} from "@/components/sidebar/sidebar-styles"

// ─── Pieces ─────────────────────────────────────────────

function AccordionReveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const transition = { duration: reduce ? 0 : SIDEBAR_DURATION_S, ease: SIDEBAR_EASE }

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="leaves"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={transition}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function NavLinkRow({ leaf, onNavigate }: { leaf: NavLeaf; onNavigate?: () => void }) {
  const pathname = usePathname()
  const isActive = isNavLeafActive(leaf, pathname)
  const Icon = leaf.icon

  return (
    <Link
      href={leaf.url}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(SIDEBAR_ROW_CLASS, isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground")}
    >
      <Icon className="size-5 shrink-0 text-sidebar-foreground/60" />
      <span className="flex-1 truncate text-left">{leaf.label}</span>
    </Link>
  )
}

function UniverseRow({
  universe,
  isActive,
  isOpen,
  onSelect,
}: {
  universe: NavUniverse
  /** The current route belongs to this universe. */
  isActive: boolean
  /** Its accordion is open. */
  isOpen: boolean
  onSelect: (universe: NavUniverse) => void
}) {
  const Icon = universe.icon

  return (
    <button
      type="button"
      onClick={() => onSelect(universe)}
      aria-expanded={isOpen}
      aria-current={isActive ? "true" : undefined}
      className={cn("group/uni", SIDEBAR_ROW_CLASS, isActive && "font-medium text-sidebar-accent-foreground")}
      style={isActive && universe.color ? { backgroundColor: tintedActiveBackground(universe.color) } : undefined}
    >
      <span
        className="relative shrink-0"
        data-universe-tint={universe.color ? "" : undefined}
        style={universe.color ? ({ "--u-color": universe.color } as React.CSSProperties) : undefined}
      >
        <Icon className={cn("size-5 shrink-0", universe.color ? "universe-tint-icon" : "text-sidebar-foreground/60")} />
      </span>
      <span className="flex-1 truncate text-left">{universe.label}</span>
      <ChevronRight
        className={cn(
          "size-3.5 shrink-0 text-sidebar-foreground/35 transition-transform duration-200 motion-reduce:transition-none group-hover/uni:text-sidebar-foreground/70",
          isOpen && "rotate-90"
        )}
      />
    </button>
  )
}

// ─── Column ─────────────────────────────────────────────

interface SidebarColumnProps {
  user: SidebarUser
  activeUniverse: NavUniverse | null
  selectedUniverse: NavUniverse | null
  onSelectUniverse: (universe: NavUniverse) => void
  /** Hidden on mobile, where the column lives in a sheet. */
  onCollapse?: () => void
  /** Called after any navigation (closes the mobile sheet). */
  onNavigate?: () => void
}

export function SidebarColumn({
  user,
  activeUniverse,
  selectedUniverse,
  onSelectUniverse,
  onCollapse,
  onNavigate,
}: SidebarColumnProps) {
  return (
    <div className="flex h-full w-64 shrink-0 flex-col overflow-hidden bg-sidebar">
      <nav aria-label="Navigation principale" className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="flex flex-col gap-0.5">
          <NavLinkRow leaf={NAV_ASSISTANT} onNavigate={onNavigate} />
          <div className="my-2 h-px w-full bg-sidebar-border" aria-hidden />

          {NAV_UNIVERSES.map((universe) => {
            const isOpen = selectedUniverse?.id === universe.id
            return (
              <div key={universe.id} className="flex flex-col">
                <UniverseRow
                  universe={universe}
                  isActive={activeUniverse?.id === universe.id}
                  isOpen={isOpen}
                  onSelect={onSelectUniverse}
                />
                <AccordionReveal open={isOpen}>
                  <div
                    className={cn(LEAF_INDENT_CLASS, "mt-0.5 mb-1")}
                    data-universe-tint={universe.color ? "" : undefined}
                    style={universe.color ? ({ "--u-color": universe.color } as React.CSSProperties) : undefined}
                  >
                    <UniverseLeafList universe={universe} onNavigate={onNavigate} />
                  </div>
                </AccordionReveal>
              </div>
            )
          })}
        </div>
      </nav>

      {/* Global links, pinned outside the scroll area */}
      <div className="shrink-0 px-2 pb-2">
        <div className="mt-3 flex flex-col gap-0.5 border-t border-sidebar-border pt-2">
          {NAV_FOOTER_LEAVES.map((leaf) => (
            <NavLinkRow key={leaf.id} leaf={leaf} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      {/* Account · collapse */}
      <div className="flex shrink-0 items-center gap-1 border-t border-sidebar-border px-2 py-1.5">
        <SidebarUserMenu user={user} side="top" />
        <div className="flex-1" />
        {onCollapse ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={onCollapse} aria-label="Replier la barre latérale" className={FOOTER_BUTTON_CLASS}>
                <PanelLeftClose className="size-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Replier · ⌘B</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </div>
  )
}
