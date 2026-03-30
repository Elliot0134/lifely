import { useQuery } from '@tanstack/react-query'

// Types pour les API
interface DashboardFilters {
  month?: number
  year?: number
  account_id?: string
}

interface DashboardKPIs {
  revenue: number
  expenses: number
  savings: number
  credit: number
  net_income: number
  revenue_growth: number
  expense_growth: number
}

interface DashboardBreakdown {
  revenue: number
  variable_expense: number
  fixed_expense: number
  credit: number
  savings: number
}

interface CategoryBreakdownItem {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  total: number
  transaction_count: number
  type: string
  account_id: string
  account_name: string
}

interface DashboardData {
  kpis: DashboardKPIs
  breakdown_by_type: DashboardBreakdown
  category_breakdown: CategoryBreakdownItem[]
  period: { month: number; year: number }
  comparison_period: { month: number; year: number }
}

// Query Keys Factory
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (filters: DashboardFilters) => [...dashboardKeys.all, 'stats', filters] as const,
}

// API Functions
async function fetchDashboardStats(filters: DashboardFilters = {}) {
  const params = new URLSearchParams()

  // Utiliser le mois/année actuel par défaut
  const now = new Date()
  const defaultFilters = {
    month: now.getMonth() + 1, // JavaScript months sont 0-indexés
    year: now.getFullYear(),
    ...filters,
  }

  Object.entries(defaultFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString())
    }
  })

  const response = await fetch(`/api/dashboard/stats?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la récupération des statistiques')
  }

  return response.json()
}

// React Query Hooks
export function useDashboardStats(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: dashboardKeys.stats(filters),
    queryFn: () => fetchDashboardStats(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes (les stats peuvent changer souvent)
    refetchOnWindowFocus: true, // Actualiser quand l'utilisateur revient sur l'onglet
  })
}

// Hook utilitaire pour obtenir la période actuelle
export function useCurrentPeriod() {
  const now = new Date()
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }
}