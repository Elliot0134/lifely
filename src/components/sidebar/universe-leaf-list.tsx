"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { isNavLeafActive, type NavLeaf, type NavSection, type NavUniverse } from "@/config/navigation"

import { SoonTag } from "@/components/sidebar/soon-tag"
import { tintedActiveBackground } from "@/components/sidebar/sidebar-styles"

// ─── Leaf row ───────────────────────────────────────────

interface LeafRowProps {
  leaf: NavLeaf
  index: number
  universeColor?: string
  onNavigate?: () => void
}

function LeafRow({ leaf, index, universeColor, onNavigate }: LeafRowProps) {
  const pathname = usePathname()
  const isActive = isNavLeafActive(leaf, pathname)
  const Icon = leaf.icon

  // Coloured universes: full colour when active, desaturated towards the muted
  // text colour otherwise (never a lower opacity).
  const iconStyle: React.CSSProperties | undefined = universeColor
    ? {
        color: isActive
          ? universeColor
          : `color-mix(in oklab, ${universeColor} 55%, var(--muted-foreground))`,
      }
    : undefined

  return (
    <div
      className="relative flex items-center animate-in fade-in-0 slide-in-from-left-2 fill-mode-both ease-out motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index * 28, 280)}ms`, animationDuration: "320ms" }}
    >
      <Link
        href={leaf.url}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex h-9 flex-1 items-center gap-2 rounded-md px-2 text-left text-sm transition-colors duration-150 hover:bg-sidebar-accent motion-reduce:transition-none",
          isActive && "font-medium text-sidebar-accent-foreground",
          isActive && !universeColor && "bg-sidebar-accent"
        )}
        style={isActive && universeColor ? { backgroundColor: tintedActiveBackground(universeColor) } : undefined}
      >
        <Icon
          className={cn("size-5 shrink-0", !universeColor && "text-sidebar-foreground/60")}
          style={iconStyle}
        />
        <span className="flex-1 truncate">{leaf.label}</span>
        {leaf.comingSoon ? <SoonTag /> : null}
      </Link>
    </div>
  )
}

// ─── Section divider ────────────────────────────────────

function SectionDivider({ section }: { section: NavSection }) {
  const SectionIcon = section.icon
  return (
    <div className="mt-1 mb-0.5 flex items-center gap-2 px-2 text-sm text-sidebar-foreground/50 animate-in fade-in-0 slide-in-from-left-2 fill-mode-both ease-out motion-reduce:animate-none">
      <span className="h-px flex-1 bg-sidebar-border" aria-hidden />
      {SectionIcon ? <SectionIcon className="universe-tint-icon size-4 shrink-0" aria-hidden /> : null}
      <span className="truncate">{section.label}</span>
      <span className="h-px flex-1 bg-sidebar-border" aria-hidden />
    </div>
  )
}

// ─── List ───────────────────────────────────────────────

interface UniverseLeafListProps {
  universe: NavUniverse
  onNavigate?: () => void
}

export function UniverseLeafList({ universe, onNavigate }: UniverseLeafListProps) {
  // Running index across sections so the cascade flows from top to bottom.
  let index = 0

  return (
    <div className="flex flex-col gap-1">
      {universe.sections.map((section, sectionIndex) => (
        <div key={section.label ?? sectionIndex} className="flex flex-col gap-0.5">
          {section.label ? <SectionDivider section={section} /> : null}
          {section.items.map((leaf) => (
            <LeafRow
              key={leaf.id}
              leaf={leaf}
              index={index++}
              universeColor={universe.color}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
