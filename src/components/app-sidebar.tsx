"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  CreditCard,
  Target,
  Tag,
  Settings,
  Wallet,
  User,
  LineChart,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  const data = {
    user: user ? {
      name: user.name,
      email: user.email,
      avatar: user.avatar || "/avatars/default.png",
    } : {
      name: "Utilisateur",
      email: "user@example.com",
      avatar: "/avatars/default.png",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: BarChart3,
        isActive: pathname === "/dashboard",
      },
      {
        title: "Transactions",
        url: "/dashboard/transactions",
        icon: CreditCard,
        isActive: pathname.startsWith("/dashboard/transactions"),
      },
      {
        title: "Budgets",
        url: "/dashboard/budgets",
        icon: Target,
        isActive: pathname.startsWith("/dashboard/budgets"),
      },
      {
        title: "Catégories",
        url: "/dashboard/categories",
        icon: Tag,
        isActive: pathname.startsWith("/dashboard/categories"),
      },
      {
        title: "Analytiques",
        url: "/dashboard/analytics",
        icon: LineChart,
        isActive: pathname.startsWith("/dashboard/analytics"),
      },
    ],
    navSecondary: [
      {
        title: "Paramètres",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
    projects: [
      {
        name: "Personnel",
        url: "/dashboard?account=personal",
        icon: User,
      },
      {
        name: "Professionnel",
        url: "/dashboard?account=business",
        icon: Wallet,
      },
    ],
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <span className="text-lg">💰</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Lifely</span>
                  <span className="truncate text-xs">Finances personnelles</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
