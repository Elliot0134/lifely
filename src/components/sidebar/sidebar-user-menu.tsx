"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { LogOut, Moon, Settings, Sun } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FOOTER_BUTTON_CLASS } from "@/components/sidebar/sidebar-styles"

export interface SidebarUser {
  name: string
  email: string
  avatar?: string | null
}

const ITEM_CLASS =
  "rounded-md hover:bg-sidebar-accent focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
  return initials || "?"
}

/** Avatar-only account button that opens the account menu (Aurentia's `NavUser iconOnly`). */
export function SidebarUserMenu({
  user,
  side = "right",
}: {
  user: SidebarUser
  side?: "right" | "top"
}) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const initials = getInitials(user.name)

  const handleSignOut = async () => {
    const { error } = await createClient().auth.signOut()
    if (error) {
      toast.error("Impossible de vous déconnecter. Réessayez.")
      return
    }
    router.push("/login")
    router.refresh()
  }

  const avatar = (className: string) => (
    <Avatar className={cn("rounded-lg", className)}>
      {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
      <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
    </Avatar>
  )

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            aria-label={`Compte : ${user.name}`}
            className={cn(
              FOOTER_BUTTON_CLASS,
              "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            )}
          >
            {avatar("size-8 grayscale")}
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side={side}>{user.name}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="min-w-56 rounded-lg" side={side} align="end" sideOffset={4}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            {avatar("h-8 w-8")}
            <div className="grid flex-1 leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className={ITEM_CLASS}>
          <Link href="/settings">
            <Settings />
            Paramètres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM_CLASS} onSelect={() => setTheme(isDark ? "light" : "dark")}>
          {isDark ? <Sun /> : <Moon />}
          {isDark ? "Thème clair" : "Thème sombre"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={ITEM_CLASS} onSelect={handleSignOut}>
          <LogOut />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
