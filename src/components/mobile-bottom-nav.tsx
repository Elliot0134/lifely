"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Tags,
  Menu,
} from "lucide-react"

import { useSidebar } from "@/components/ui/sidebar"

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    match: (path: string) => path === "/",
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
    match: (path: string) => path.startsWith("/transactions"),
  },
  {
    label: "Budgets",
    href: "/budgets",
    icon: PiggyBank,
    match: (path: string) => path.startsWith("/budgets"),
  },
  {
    label: "Catégories",
    href: "/categories",
    icon: Tags,
    match: (path: string) => path.startsWith("/categories"),
  },
] as const


export function MobileBottomNav() {
  const pathname = usePathname()
  // "Menu" opens the full navigation (universes) in the sidebar's mobile sheet.
  const { openMobile, setOpenMobile } = useSidebar()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Bottom bar */}
      <div className="bg-background/80 backdrop-blur-lg border-t border-border/30 pb-[calc(env(safe-area-inset-bottom)+12px)] px-2 pt-1">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-0"
              >
                {/* Active indicator line */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
                )}
                <item.icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? "text-primary fill-primary/20"
                      : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] leading-tight truncate max-w-[64px] ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* Menu button */}
          <button
            type="button"
            onClick={() => setOpenMobile(true)}
            className="relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-0"
            aria-label="Ouvrir le menu"
            aria-expanded={openMobile}
          >
            <Menu className="h-5 w-5 text-muted-foreground transition-colors" />
            <span className="text-[10px] leading-tight text-muted-foreground">Menu</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
