import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CalendarCheck,
  CalendarClock,
  Car,
  ChartPie,
  ClipboardList,
  CookingPot,
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
  Key,
  KeyRound,
  Landmark,
  LineChart,
  ListTodo,
  Map,
  Moon,
  Network,
  Package,
  PartyPopper,
  PiggyBank,
  Plane,
  Repeat,
  Rocket,
  Rss,
  Settings,
  ShoppingCart,
  Smile,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  Tag,
  Target,
  Users,
  UsersRound,
  UtensilsCrossed,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────
// Navigation tree shared by the rail (collapsed) and the column (expanded).
// Mirrors the "universe → sections → leaves" model of Aurentia's nav-tree.

export interface NavLeaf {
  id: string
  label: string
  url: string
  icon: LucideIcon
  /** Page exists but only shows a "Coming soon" screen. */
  comingSoon?: boolean
  /** Active only on an exact pathname match (e.g. "/"). */
  strictActive?: boolean
}

export interface NavSection {
  /** Untitled sections render without a divider label. */
  label?: string
  icon?: LucideIcon
  items: NavLeaf[]
}

export interface NavUniverse {
  id: string
  label: string
  icon: LucideIcon
  /** Hex colour used to tint icons and the active row. */
  color?: string
  /** Longest matching prefix decides the active universe. */
  routePrefixes: string[]
  sections: NavSection[]
}

// ─── Tree ───────────────────────────────────────────────

export const NAV_UNIVERSES: NavUniverse[] = [
  {
    id: "finance",
    label: "Finances",
    icon: Wallet,
    color: "#8b9a6b",
    routePrefixes: ["/transactions", "/budgets", "/categories", "/analytics", "/subscriptions", "/patrimoine", "/savings-goals"],
    sections: [
      {
        items: [
          { id: "dashboard", label: "Tableau de bord", url: "/", icon: BarChart3, strictActive: true },
          { id: "transactions", label: "Transactions", url: "/transactions", icon: CreditCard },
          { id: "budgets", label: "Budgets", url: "/budgets", icon: Target },
          { id: "categories", label: "Catégories", url: "/categories", icon: Tag },
          { id: "analytics", label: "Analytiques", url: "/analytics", icon: LineChart },
        ],
      },
      {
        label: "Patrimoine",
        icon: Landmark,
        items: [
          { id: "subscriptions", label: "Abonnements", url: "/subscriptions", icon: Repeat, comingSoon: true },
          { id: "patrimoine", label: "Patrimoine", url: "/patrimoine", icon: Sparkles, comingSoon: true },
          { id: "savings-goals", label: "Épargne", url: "/savings-goals", icon: PiggyBank, comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "organisation",
    label: "Organisation",
    icon: ListTodo,
    color: "#f26a4b",
    routePrefixes: ["/tasks", "/planning", "/projects", "/companies", "/habits", "/goals", "/notes", "/calendar"],
    sections: [
      {
        items: [
          { id: "tasks", label: "Tâches", url: "/tasks", icon: ListTodo },
          { id: "planning", label: "Planning", url: "/planning", icon: CalendarClock },
          { id: "projects", label: "Projets", url: "/projects", icon: FolderKanban },
          { id: "companies", label: "Entreprises", url: "/companies", icon: Building2 },
          { id: "habits", label: "Habitudes", url: "/habits", icon: Repeat },
          { id: "notes", label: "Notes", url: "/notes", icon: BookOpen },
        ],
      },
      {
        label: "Suivi",
        icon: ChartPie,
        items: [
          { id: "tasks-stats", label: "Statistiques", url: "/tasks/stats", icon: ChartPie },
          { id: "goals", label: "Objectifs", url: "/goals", icon: Target, comingSoon: true },
          { id: "calendar", label: "Calendrier", url: "/calendar", icon: CalendarCheck, comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: FolderLock,
    color: "#7d8ba1",
    routePrefixes: ["/admin"],
    sections: [
      {
        items: [
          { id: "admin", label: "Vue d'ensemble", url: "/admin", icon: FolderLock, comingSoon: true, strictActive: true },
          { id: "admin-documents", label: "Documents", url: "/admin/documents", icon: FileText, comingSoon: true },
          { id: "admin-deadlines", label: "Échéances", url: "/admin/deadlines", icon: CalendarCheck, comingSoon: true },
          { id: "admin-accounts", label: "Comptes & accès", url: "/admin/accounts", icon: KeyRound, comingSoon: true },
          { id: "admin-api-keys", label: "Clés API", url: "/admin/api-keys", icon: Key, comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "sante",
    label: "Santé",
    icon: Heart,
    color: "#c45c5c",
    routePrefixes: ["/health"],
    sections: [
      {
        items: [
          { id: "health", label: "Vue d'ensemble", url: "/health", icon: Heart, comingSoon: true, strictActive: true },
          { id: "health-fitness", label: "Fitness", url: "/health/fitness", icon: Dumbbell, comingSoon: true },
          { id: "health-nutrition", label: "Nutrition", url: "/health/nutrition", icon: UtensilsCrossed, comingSoon: true },
          { id: "health-sleep", label: "Sommeil", url: "/health/sleep", icon: Moon, comingSoon: true },
          { id: "health-hydration", label: "Hydratation", url: "/health/hydration", icon: Droplets, comingSoon: true },
          { id: "health-mood", label: "Humeur", url: "/health/mood", icon: Smile, comingSoon: true },
        ],
      },
      {
        label: "Médical",
        icon: Stethoscope,
        items: [
          { id: "health-appointments", label: "RDV médicaux", url: "/health/appointments", icon: Stethoscope, comingSoon: true },
          { id: "health-prescriptions", label: "Ordonnances", url: "/health/prescriptions", icon: FileText, comingSoon: true },
          { id: "health-vaccines", label: "Vaccins", url: "/health/vaccines", icon: Syringe, comingSoon: true },
          { id: "health-doctors", label: "Mes médecins", url: "/health/doctors", icon: UsersRound, comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "maison",
    label: "Maison",
    icon: Home,
    color: "#c9a227",
    routePrefixes: ["/home"],
    sections: [
      {
        items: [
          { id: "home", label: "Vue d'ensemble", url: "/home", icon: Home, comingSoon: true, strictActive: true },
          { id: "home-inventory", label: "Inventaire", url: "/home/inventory", icon: Package, comingSoon: true },
          { id: "home-maintenance", label: "Entretien", url: "/home/maintenance", icon: Wrench, comingSoon: true },
          { id: "home-shopping", label: "Courses", url: "/home/shopping", icon: ShoppingCart, comingSoon: true },
          { id: "home-meals", label: "Repas", url: "/home/meals", icon: UtensilsCrossed, comingSoon: true },
          { id: "home-recipes", label: "Recettes", url: "/home/recipes", icon: CookingPot, comingSoon: true },
          { id: "home-vehicles", label: "Véhicules", url: "/home/vehicles", icon: Car, comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "carriere",
    label: "Carrière",
    icon: GraduationCap,
    color: "#8a6fb0",
    routePrefixes: ["/career"],
    sections: [
      {
        items: [
          { id: "career", label: "Vue d'ensemble", url: "/career", icon: GraduationCap, comingSoon: true, strictActive: true },
          { id: "career-skills", label: "Compétences", url: "/career/skills", icon: Star, comingSoon: true },
          { id: "career-reading", label: "Lectures", url: "/career/reading", icon: BookOpen, comingSoon: true },
          { id: "career-side-projects", label: "Side projects", url: "/career/side-projects", icon: Rocket, comingSoon: true },
          { id: "career-networking", label: "Networking", url: "/career/networking", icon: Network, comingSoon: true },
          { id: "career-watch", label: "Veille", url: "/career/watch", icon: Rss, comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "social",
    label: "Social",
    icon: Users,
    color: "#d4789c",
    routePrefixes: ["/social"],
    sections: [
      {
        items: [
          { id: "social", label: "Vue d'ensemble", url: "/social", icon: Users, comingSoon: true, strictActive: true },
          { id: "social-contacts", label: "Contacts", url: "/social/contacts", icon: UsersRound, comingSoon: true },
          { id: "social-birthdays", label: "Anniversaires", url: "/social/birthdays", icon: PartyPopper, comingSoon: true },
          { id: "social-gifts", label: "Cadeaux", url: "/social/gifts", icon: Gift, comingSoon: true },
          { id: "social-events", label: "Événements", url: "/social/events", icon: CalendarCheck, comingSoon: true },
          { id: "social-circles", label: "Cercles", url: "/social/circles", icon: UsersRound, comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "voyages",
    label: "Voyages",
    icon: Plane,
    color: "#4f9a94",
    routePrefixes: ["/travel"],
    sections: [
      {
        items: [
          { id: "travel", label: "Vue d'ensemble", url: "/travel", icon: Plane, comingSoon: true, strictActive: true },
          { id: "travel-trips", label: "Voyages prévus", url: "/travel/trips", icon: Map, comingSoon: true },
          { id: "travel-bucket-list", label: "Bucket list", url: "/travel/bucket-list", icon: ClipboardList, comingSoon: true },
          { id: "travel-wishlist", label: "Envies", url: "/travel/wishlist", icon: Star, comingSoon: true },
        ],
      },
    ],
  },
]

/** Top-level link shown above the universes. */
export const NAV_ASSISTANT: NavLeaf = { id: "assistant", label: "Assistant IA", url: "/assistant", icon: Bot }

/** Global links pinned at the bottom of the column / rail. */
export const NAV_FOOTER_LEAVES: NavLeaf[] = [
  { id: "settings", label: "Paramètres", url: "/settings", icon: Settings },
]

// ─── Resolvers ──────────────────────────────────────────

export function isNavLeafActive(leaf: NavLeaf, pathname: string): boolean {
  if (leaf.strictActive) return pathname === leaf.url
  return pathname === leaf.url || pathname.startsWith(`${leaf.url}/`)
}

/** Universe owning the current route; "/" belongs to Finances. */
export function getUniverseForPath(pathname: string): NavUniverse | null {
  if (pathname === "/") return NAV_UNIVERSES[0] ?? null

  let best: NavUniverse | null = null
  let bestLength = 0
  for (const universe of NAV_UNIVERSES) {
    for (const prefix of universe.routePrefixes) {
      const matches = pathname === prefix || pathname.startsWith(`${prefix}/`)
      if (matches && prefix.length > bestLength) {
        best = universe
        bestLength = prefix.length
      }
    }
  }
  return best
}
