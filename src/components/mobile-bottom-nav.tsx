"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Tags,
  Menu,
  Settings,
  X,
} from "lucide-react"

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    match: (path: string) => path === "/dashboard",
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: ArrowLeftRight,
    match: (path: string) => path.startsWith("/dashboard/transactions"),
  },
  {
    label: "Budgets",
    href: "/dashboard/budgets",
    icon: PiggyBank,
    match: (path: string) => path.startsWith("/dashboard/budgets"),
  },
  {
    label: "Catégories",
    href: "/dashboard/categories",
    icon: Tags,
    match: (path: string) => path.startsWith("/dashboard/categories"),
  },
] as const

const submenuItems = [
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
  },
] as const

export function MobileBottomNav() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const submenuRef = React.useRef<HTMLDivElement>(null)
  const menuButtonRef = React.useRef<HTMLButtonElement>(null)

  // Close submenu on click outside
  React.useEffect(() => {
    if (!isMenuOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        submenuRef.current &&
        !submenuRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMenuOpen])

  // Close submenu on route change
  React.useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Submenu overlay */}
      {isMenuOpen && (
        <div
          ref={submenuRef}
          className="absolute bottom-full left-4 right-4 mb-2 rounded-xl bg-white/75 dark:bg-background/75 backdrop-blur-xl border border-white/40 shadow-lg p-2"
        >
          {submenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      )}

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
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-0"
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
            )}
            {isMenuOpen ? (
              <X className="h-5 w-5 text-primary transition-colors" />
            ) : (
              <Menu className="h-5 w-5 text-muted-foreground transition-colors" />
            )}
            <span
              className={`text-[10px] leading-tight ${
                isMenuOpen
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Menu
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}
