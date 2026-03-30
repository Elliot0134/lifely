'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
} from 'lucide-react'
import { useDashboardStats } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'

export function DashboardKPIs() {
  const { data, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Erreur lors du chargement des statistiques
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const kpis = data?.data?.kpis || {}

  // Fonction pour déterminer la couleur du pourcentage
  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-[#8b9a6b]'
    if (growth < 0) return 'text-[#c45c5c]'
    return 'text-muted-foreground'
  }

  // Fonction pour formater le pourcentage
  const formatGrowth = (growth: number) => {
    const sign = growth > 0 ? '+' : ''
    return `${sign}${growth.toFixed(1)}% par rapport au mois dernier`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Revenus */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Revenus
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#8b9a6b]">
            {formatCurrency(kpis.revenue || 0, 'revenue')}
          </div>
          <p className={`text-xs ${getGrowthColor(kpis.revenue_growth || 0)}`}>
            {formatGrowth(kpis.revenue_growth || 0)}
          </p>
        </CardContent>
      </Card>

      {/* Dépenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Dépenses
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#c45c5c]">
            -{formatCurrency(kpis.expenses || 0).replace('-', '')}
          </div>
          <p className={`text-xs ${getGrowthColor(-(kpis.expense_growth || 0))}`}>
            {formatGrowth(-(kpis.expense_growth || 0))}
          </p>
        </CardContent>
      </Card>

      {/* Épargne */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Épargne
          </CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#a89f8f]">
            {formatCurrency(kpis.savings || 0, 'revenue')}
          </div>
          <p className="text-xs text-muted-foreground">
            Montant épargné ce mois
          </p>
        </CardContent>
      </Card>

      {/* Solde net */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Solde net
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            (kpis.net_income || 0) >= 0 ? 'text-[#8b9a6b]' : 'text-[#c45c5c]'
          }`}>
            {formatCurrency(kpis.net_income || 0,
              (kpis.net_income || 0) >= 0 ? 'revenue' : 'variable_expense'
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {(kpis.net_income || 0) >= 0
              ? 'Situation financière positive'
              : 'Déficit ce mois-ci'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  )
}