"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CalendarCheck,
  CalendarClock,
  Car,
  ChartPie,
  CreditCard,
  Droplets,
  Dumbbell,
  FileText,
  FolderKanban,
  FolderLock,
  Gift,
  GraduationCap,
  Heart,
  Home,
  KeyRound,
  ListTodo,
  Map,
  Moon,
  Network,
  Package,
  PartyPopper,
  Plane,
  Repeat,
  Rocket,
  Rss,
  Settings,
  ShoppingCart,
  Smile,
  Star,
  Stethoscope,
  Syringe,
  Target,
  Tag,
  Users,
  UsersRound,
  UtensilsCrossed,
  Wallet,
  Key,
  LineChart,
  ClipboardList,
  CookingPot,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Category = "finance" | "organisation" | "admin" | "sante" | "maison" | "carriere" | "social" | "voyages"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  comingSoon?: boolean
}

interface CategoryConfig {
  id: Category
  label: string
  description: string
  icon: LucideIcon
  items: NavItem[]
}

const categories: CategoryConfig[] = [
  {
    id: "finance",
    label: "Finances",
    description: "Gérer vos finances",
    icon: Wallet,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
      { title: "Transactions", url: "/transactions", icon: CreditCard },
      { title: "Budgets", url: "/budgets", icon: Target },
      { title: "Catégories", url: "/categories", icon: Tag },
      { title: "Analytiques", url: "/analytics", icon: LineChart },
      { title: "Abonnements", url: "/subscriptions", icon: Repeat, comingSoon: true },
      { title: "Patrimoine", url: "/patrimoine", icon: Sparkles, comingSoon: true },
      { title: "Épargne", url: "/savings-goals", icon: Target, comingSoon: true },
    ],
  },
  {
    id: "organisation",
    label: "Organisation",
    description: "Gérer votre quotidien",
    icon: ListTodo,
    items: [
      { title: "Tâches", url: "/tasks", icon: ListTodo },
      { title: "Planning", url: "/tasks/schedule", icon: CalendarClock },
      { title: "Projets", url: "/projects", icon: FolderKanban },
      { title: "Entreprises", url: "/companies", icon: Building2 },
      { title: "Statistiques", url: "/tasks/stats", icon: ChartPie },
      { title: "Habitudes", url: "/habits", icon: Repeat, comingSoon: true },
      { title: "Objectifs", url: "/goals", icon: Target, comingSoon: true },
      { title: "Notes", url: "/notes", icon: BookOpen },
      { title: "Calendrier", url: "/calendar", icon: CalendarClock, comingSoon: true },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    description: "Documents & démarches",
    icon: FolderLock,
    items: [
      { title: "Vue d'ensemble", url: "/admin", icon: FolderLock, comingSoon: true },
      { title: "Documents", url: "/admin/documents", icon: FileText, comingSoon: true },
      { title: "Échéances", url: "/admin/deadlines", icon: CalendarCheck, comingSoon: true },
      { title: "Comptes & accès", url: "/admin/accounts", icon: KeyRound, comingSoon: true },
      { title: "Clés API", url: "/admin/api-keys", icon: Key, comingSoon: true },
    ],
  },
  {
    id: "sante",
    label: "Santé",
    description: "Suivre votre bien-être",
    icon: Heart,
    items: [
      { title: "Vue d'ensemble", url: "/health", icon: Heart, comingSoon: true },
      { title: "Fitness", url: "/health/fitness", icon: Dumbbell, comingSoon: true },
      { title: "Nutrition", url: "/health/nutrition", icon: UtensilsCrossed, comingSoon: true },
      { title: "Sommeil", url: "/health/sleep", icon: Moon, comingSoon: true },
      { title: "Hydratation", url: "/health/hydration", icon: Droplets, comingSoon: true },
      { title: "Humeur", url: "/health/mood", icon: Smile, comingSoon: true },
      { title: "RDV médicaux", url: "/health/appointments", icon: Stethoscope, comingSoon: true },
      { title: "Ordonnances", url: "/health/prescriptions", icon: FileText, comingSoon: true },
      { title: "Vaccins", url: "/health/vaccines", icon: Syringe, comingSoon: true },
      { title: "Mes médecins", url: "/health/doctors", icon: UsersRound, comingSoon: true },
    ],
  },
  {
    id: "maison",
    label: "Maison",
    description: "Gérer votre foyer",
    icon: Home,
    items: [
      { title: "Vue d'ensemble", url: "/home", icon: Home, comingSoon: true },
      { title: "Inventaire", url: "/home/inventory", icon: Package, comingSoon: true },
      { title: "Entretien", url: "/home/maintenance", icon: Wrench, comingSoon: true },
      { title: "Courses", url: "/home/shopping", icon: ShoppingCart, comingSoon: true },
      { title: "Meal Planning", url: "/home/meals", icon: UtensilsCrossed, comingSoon: true },
      { title: "Recettes", url: "/home/recipes", icon: CookingPot, comingSoon: true },
      { title: "Véhicules", url: "/home/vehicles", icon: Car, comingSoon: true },
    ],
  },
  {
    id: "carriere",
    label: "Carrière",
    description: "Développer vos compétences",
    icon: GraduationCap,
    items: [
      { title: "Vue d'ensemble", url: "/career", icon: GraduationCap, comingSoon: true },
      { title: "Compétences", url: "/career/skills", icon: Star, comingSoon: true },
      { title: "Lectures", url: "/career/reading", icon: BookOpen, comingSoon: true },
      { title: "Side Projects", url: "/career/side-projects", icon: Rocket, comingSoon: true },
      { title: "Networking", url: "/career/networking", icon: Network, comingSoon: true },
      { title: "Veille", url: "/career/watch", icon: Rss, comingSoon: true },
    ],
  },
  {
    id: "social",
    label: "Social",
    description: "Vos relations & événements",
    icon: Users,
    items: [
      { title: "Vue d'ensemble", url: "/social", icon: Users, comingSoon: true },
      { title: "Contacts", url: "/social/contacts", icon: UsersRound, comingSoon: true },
      { title: "Anniversaires", url: "/social/birthdays", icon: PartyPopper, comingSoon: true },
      { title: "Cadeaux", url: "/social/gifts", icon: Gift, comingSoon: true },
      { title: "Événements", url: "/social/events", icon: CalendarCheck, comingSoon: true },
      { title: "Cercles", url: "/social/circles", icon: UsersRound, comingSoon: true },
    ],
  },
  {
    id: "voyages",
    label: "Voyages",
    description: "Planifier vos aventures",
    icon: Plane,
    items: [
      { title: "Vue d'ensemble", url: "/travel", icon: Plane, comingSoon: true },
      { title: "Trip Planner", url: "/travel/trips", icon: Map, comingSoon: true },
      { title: "Bucket List", url: "/travel/bucket-list", icon: ClipboardList, comingSoon: true },
      { title: "Wishlist", url: "/travel/wishlist", icon: Star, comingSoon: true },
    ],
  },
]

const secondaryItems: NavItem[] = [
  { title: "Paramètres", url: "/settings", icon: Settings },
]

function getCategoryFromPathname(pathname: string): Category {
  const categoryPrefixes: Record<string, Category> = {
    "/tasks": "organisation",
    "/projects": "organisation",
    "/companies": "organisation",
    "/habits": "organisation",
    "/goals": "organisation",
    "/notes": "organisation",
    "/calendar": "organisation",
    "/admin": "admin",
    "/health": "sante",
    "/home": "maison",
    "/career": "carriere",
    "/social": "social",
    "/travel": "voyages",
  }

  for (const [prefix, category] of Object.entries(categoryPrefixes)) {
    if (pathname.startsWith(prefix)) return category
  }

  return "finance"
}

function isItemActive(url: string, pathname: string): boolean {
  if (url === "/dashboard") return pathname === "/dashboard"
  return pathname.startsWith(url)
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const [activeCategory, setActiveCategory] = React.useState<Category>(
    getCategoryFromPathname(pathname)
  )

  // Sync category with route changes
  React.useEffect(() => {
    setActiveCategory(getCategoryFromPathname(pathname))
  }, [pathname])

  const activeCategoryConfig = categories.find((c) => c.id === activeCategory)!

  const userData = user
    ? {
        name: user.name,
        email: user.email,
        avatar: user.avatar || "/avatars/default.png",
      }
    : {
        name: "Utilisateur",
        email: "user@example.com",
        avatar: "/avatars/default.png",
      }

  return (
    <Sidebar variant="inset" {...props}>
      <div className="flex h-full w-full">
        {/* Icon Rail */}
        <div className="flex w-[52px] shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-3">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="mb-4 flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-colors hover:bg-sidebar-primary/90"
          >
            <span className="text-base font-bold">L</span>
          </Link>

          {/* Category Icons */}
          <div className="flex flex-1 flex-col items-center gap-1 overflow-auto">
            {categories.map((category) => {
              const Icon = category.icon
              const isActive = activeCategory === category.id
              return (
                <Tooltip key={category.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveCategory(category.id)}
                      className={cn(
                        "relative flex size-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeCategory"
                          className="absolute inset-0 rounded-lg bg-sidebar-accent"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon className="relative z-10 size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {category.label}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>

          {/* Bottom: Chatbot + Settings + Theme */}
          <div className="flex flex-col items-center gap-1">
            {/* AI Chatbot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/assistant"
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg transition-colors",
                    pathname.startsWith("/assistant")
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Bot className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Assistant IA
              </TooltipContent>
            </Tooltip>

            {secondaryItems.map((item) => {
              const Icon = item.icon
              const isActive = isItemActive(item.url, pathname)
              return (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.url}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            })}
            <div className="mt-1">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Category Header */}
          <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-sidebar-border px-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2"
              >
                <activeCategoryConfig.icon className="size-4 text-sidebar-foreground/70" />
                <div>
                  <p className="text-sm font-semibold leading-none">
                    {activeCategoryConfig.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-sidebar-foreground/50">
                    {activeCategoryConfig.description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-auto px-2 py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <SidebarMenu>
                  {activeCategoryConfig.items.map((item) => {
                    const active = isItemActive(item.url, pathname)
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild data-active={active}>
                          <Link href={item.url}>
                            <item.icon className="size-4" />
                            <span className="flex-1">{item.title}</span>
                            {item.comingSoon && (
                              <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px] font-medium">
                                Bientôt
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer: User */}
          <div className="border-t border-sidebar-border p-2">
            <NavUser user={userData} />
          </div>
        </div>
      </div>
    </Sidebar>
  )
}
