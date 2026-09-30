"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { getUniverseForPath, type NavUniverse } from "@/config/navigation"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useSidebar } from "@/components/ui/sidebar"
import { NavRail } from "@/components/sidebar/nav-rail"
import { SidebarColumn } from "@/components/sidebar/sidebar-column"
import type { SidebarUser } from "@/components/sidebar/sidebar-user-menu"
import {
  COLUMN_WIDTH_PX,
  RAIL_WIDTH_PX,
  SIDEBAR_DURATION_S,
  SIDEBAR_EASE,
} from "@/components/sidebar/sidebar-styles"

interface AppSidebarProps {
  user: SidebarUser
}

/**
 * Main navigation, ported from Aurentia's sidebar: a 256px column of universe
 * accordions that collapses into a 56px icon rail (hover peek per universe).
 * Open/closed state comes from shadcn's SidebarProvider, so its cookie, the
 * ⌘B shortcut and every page's SidebarTrigger keep working.
 */
export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const { open, setOpen, toggleSidebar, isMobile, openMobile, setOpenMobile } = useSidebar()
  const reduceMotion = useReducedMotion()

  const activeUniverse = getUniverseForPath(pathname)
  // Open accordion: follows the route, but a click can open another universe without navigating.
  const [selectedUniverse, setSelectedUniverse] = React.useState<NavUniverse | null>(activeUniverse)

  React.useEffect(() => {
    setSelectedUniverse(getUniverseForPath(pathname))
  }, [pathname])

  // Column: toggles the accordion (one open at a time).
  const selectUniverse = React.useCallback(
    (universe: NavUniverse) => {
      setSelectedUniverse((prev) => (prev?.id === universe.id ? null : universe))
      setOpen(true)
    },
    [setOpen]
  )

  // Rail: clicking a universe expands the column on it.
  const handleRailUniverseClick = React.useCallback(
    (universe: NavUniverse) => {
      setSelectedUniverse(universe)
      setOpen(true)
    },
    [setOpen]
  )

  const transition = { duration: reduceMotion ? 0 : SIDEBAR_DURATION_S, ease: SIDEBAR_EASE }
  const closeMobile = React.useCallback(() => setOpenMobile(false), [setOpenMobile])

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="w-64 max-w-[calc(100vw-2rem)] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Menu principal de Lifely</SheetDescription>
          <SidebarColumn
            user={user}
            activeUniverse={activeUniverse}
            selectedUniverse={selectedUniverse}
            onSelectUniverse={selectUniverse}
            onNavigate={closeMobile}
          />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    // z-20: `sticky` creates a stacking context, so without it the rail's
    // fixed peek (z-50 inside this context) would render under the content card.
    <div className="sticky top-0 z-20 hidden h-svh shrink-0 md:flex">
      <motion.div
        initial={false}
        animate={{ width: open ? COLUMN_WIDTH_PX : RAIL_WIDTH_PX }}
        transition={transition}
        className="h-full shrink-0 overflow-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div
              key="column"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              className="h-full"
            >
              <SidebarColumn
                user={user}
                activeUniverse={activeUniverse}
                selectedUniverse={selectedUniverse}
                onSelectUniverse={selectUniverse}
                onCollapse={toggleSidebar}
              />
            </motion.div>
          ) : (
            <motion.div
              key="rail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              className="h-full"
            >
              <NavRail
                user={user}
                activeUniverse={activeUniverse}
                onUniverseClick={handleRailUniverseClick}
                onExpand={toggleSidebar}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
