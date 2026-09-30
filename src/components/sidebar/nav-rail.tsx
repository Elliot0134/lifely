"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion"
import { PanelLeftOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  NAV_ASSISTANT,
  NAV_FOOTER_LEAVES,
  NAV_UNIVERSES,
  isNavLeafActive,
  type NavLeaf,
  type NavUniverse,
} from "@/config/navigation"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SidebarUserMenu, type SidebarUser } from "@/components/sidebar/sidebar-user-menu"
import { UniverseLeafList } from "@/components/sidebar/universe-leaf-list"
import { RAIL_BUTTON_CLASS } from "@/components/sidebar/sidebar-styles"

// ─── Rail items ─────────────────────────────────────────

function RailLink({ leaf }: { leaf: NavLeaf }) {
  const pathname = usePathname()
  const isActive = isNavLeafActive(leaf, pathname)
  const Icon = leaf.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={leaf.url}
          aria-label={leaf.label}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            RAIL_BUTTON_CLASS,
            "text-sidebar-foreground/70",
            isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <Icon className="size-5" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{leaf.label}</TooltipContent>
    </Tooltip>
  )
}

function UniverseRailButton({
  universe,
  isActive,
  onHover,
  onUnhover,
  onSelect,
}: {
  universe: NavUniverse
  isActive: boolean
  onHover: (universe: NavUniverse, el: HTMLElement) => void
  onUnhover: (universe: NavUniverse) => void
  onSelect: (universe: NavUniverse) => void
}) {
  const Icon = universe.icon

  return (
    <button
      type="button"
      aria-label={universe.label}
      aria-current={isActive ? "true" : undefined}
      data-active={isActive ? "true" : undefined}
      onClick={() => onSelect(universe)}
      onMouseEnter={(e) => onHover(universe, e.currentTarget)}
      onMouseLeave={() => onUnhover(universe)}
      onFocus={(e) => onHover(universe, e.currentTarget)}
      onBlur={() => onUnhover(universe)}
      style={universe.color ? ({ "--u-color": universe.color } as React.CSSProperties) : undefined}
      className={cn(
        RAIL_BUTTON_CLASS,
        universe.color
          ? "universe-rail-btn"
          : cn("text-sidebar-foreground/70", isActive && "bg-sidebar-accent text-sidebar-accent-foreground")
      )}
    >
      <Icon className="size-5" />
    </button>
  )
}

// ─── Peek (hover card) ──────────────────────────────────

interface PeekState {
  universe: NavUniverse
  top: number
  left: number
  /** Anchored by its bottom edge when there is no room below. */
  flip: boolean
  maxHeight: number
}

function peekTransition(reduce: boolean | null): Transition {
  if (reduce) {
    return { top: { duration: 0 }, y: { duration: 0 }, opacity: { duration: 0 }, x: { duration: 0 } }
  }
  return {
    top: { type: "spring", stiffness: 600, damping: 44 },
    y: { type: "spring", stiffness: 600, damping: 44 },
    opacity: { duration: 0.12 },
    x: { duration: 0.13, ease: "easeOut" },
  }
}

// ─── Rail ───────────────────────────────────────────────

interface NavRailProps {
  user: SidebarUser
  activeUniverse: NavUniverse | null
  onUniverseClick: (universe: NavUniverse) => void
  onExpand: () => void
}

export function NavRail({ user, activeUniverse, onUniverseClick, onExpand }: NavRailProps) {
  const reduceMotion = useReducedMotion()
  const transition = React.useMemo(() => peekTransition(reduceMotion), [reduceMotion])

  // One shared card that springs from icon to icon instead of one card per icon.
  const [peek, setPeek] = React.useState<PeekState | null>(null)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  // Universe just clicked: its peek stays closed until the pointer leaves and comes back.
  const suppressId = React.useRef<string | null>(null)

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const scheduleClose = React.useCallback(() => {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => setPeek(null), 140)
  }, [clearCloseTimer])

  const handleHover = React.useCallback(
    (universe: NavUniverse, el: HTMLElement) => {
      if (suppressId.current === universe.id) return
      clearCloseTimer()
      const rect = el.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.top - 12
      const spaceAbove = rect.bottom - 12
      const flip = spaceBelow < 260 && spaceAbove > spaceBelow
      setPeek({
        universe,
        top: flip ? rect.bottom : rect.top,
        left: rect.right,
        flip,
        maxHeight: Math.max(flip ? spaceAbove : spaceBelow, 0),
      })
    },
    [clearCloseTimer]
  )

  const handleUnhover = React.useCallback(
    (universe: NavUniverse) => {
      if (suppressId.current === universe.id) suppressId.current = null
      scheduleClose()
    },
    [scheduleClose]
  )

  const handleSelect = React.useCallback(
    (universe: NavUniverse) => {
      onUniverseClick(universe)
      suppressId.current = universe.id
      clearCloseTimer()
      setPeek(null)
    },
    [onUniverseClick, clearCloseTimer]
  )

  React.useEffect(() => clearCloseTimer, [clearCloseTimer])

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={0} disableHoverableContent>
      <nav
        aria-label="Navigation principale"
        className="scrollbar-hide flex h-full w-14 shrink-0 flex-col items-center gap-0.5 overflow-y-auto bg-sidebar px-2 py-2 [&>*]:shrink-0"
      >
        <RailLink leaf={NAV_ASSISTANT} />
        <div className="my-2 h-px w-6 shrink-0 bg-sidebar-border" aria-hidden />

        <div className="flex flex-1 shrink-0 flex-col items-center gap-0.5">
          {NAV_UNIVERSES.map((universe) => (
            <UniverseRailButton
              key={universe.id}
              universe={universe}
              isActive={activeUniverse?.id === universe.id}
              onHover={handleHover}
              onUnhover={handleUnhover}
              onSelect={handleSelect}
            />
          ))}
        </div>

        <AnimatePresence>
          {peek ? (
            <motion.div
              key="rail-universe-peek"
              initial={{ opacity: 0, x: -6, top: peek.top, y: peek.flip ? "-100%" : 0 }}
              animate={{ opacity: 1, x: 0, top: peek.top, y: peek.flip ? "-100%" : 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={transition}
              data-universe-tint={peek.universe.color ? "" : undefined}
              style={
                {
                  position: "fixed",
                  left: peek.left + 6,
                  maxHeight: peek.maxHeight,
                  ...(peek.universe.color ? { "--u-color": peek.universe.color } : {}),
                } as React.CSSProperties
              }
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
              className="z-50 w-64 overflow-y-auto rounded-md border bg-popover p-2 text-popover-foreground shadow-md"
            >
              <div className="px-2 pb-2 text-base font-semibold">{peek.universe.label}</div>
              <UniverseLeafList universe={peek.universe} onNavigate={() => setPeek(null)} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="my-1 h-px w-6 bg-sidebar-border" aria-hidden />
        {NAV_FOOTER_LEAVES.map((leaf) => (
          <RailLink key={leaf.id} leaf={leaf} />
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Déplier la barre latérale"
              className={cn(RAIL_BUTTON_CLASS, "text-sidebar-foreground/70")}
            >
              <PanelLeftOpen className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Déplier · ⌘B</TooltipContent>
        </Tooltip>
        <div className="my-1 h-px w-6 bg-sidebar-border" aria-hidden />
        <SidebarUserMenu user={user} />
      </nav>
    </TooltipProvider>
  )
}
