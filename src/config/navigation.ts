import {
  BarChart3,
  CreditCard,
  Target,
  Tag,
  Settings,
  Plus
} from "lucide-react"

export const dashboardNavigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    description: "Vue d'ensemble de vos finances",
  },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: CreditCard,
    description: "Gérer vos revenus et dépenses",
  },
  {
    title: "Budgets",
    href: "/dashboard/budgets",
    icon: Target,
    description: "Définir et suivre vos objectifs",
  },
  {
    title: "Catégories",
    href: "/dashboard/categories",
    icon: Tag,
    description: "Organiser vos transactions",
  },
]

export const secondaryNavigation = [
  {
    title: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Configuration de l'application",
  },
]

export const quickActions = [
  {
    title: "Nouvelle transaction",
    href: "/dashboard/transactions/new",
    icon: Plus,
    description: "Ajouter rapidement une transaction",
    shortcut: "⌘N",
  },
]