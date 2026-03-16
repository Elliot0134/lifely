'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface KPIData {
  totalBalance: number
  monthlyRevenue: number
  monthlyExpenses: number
  monthlySavings: number
  revenueTrend: number | null
  expensesTrend: number | null
  savingsTrend: number | null
  balanceTrend: number | null
}

function KPISkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-28 mb-2" />
            <Skeleton className="h-3 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-xs text-muted-foreground">
        Pas de donnees precedentes
      </span>
    )
  }

  const isPositive = value > 0
  const isZero = value === 0
  const sign = isPositive ? '+' : ''
  const colorClass = isZero
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'

  return (
    <span className={`text-xs ${colorClass}`}>
      {sign}{value.toFixed(1)}% vs mois dernier
    </span>
  )
}

export function KPICards() {
  const [data, setData] = useState<KPIData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchKPIs() {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        // Current month/year
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        // Previous month
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

        // Fetch current month, previous month, and all-time in parallel
        const [currentRes, previousRes, allTimeRes] = await Promise.all([
          supabase
            .from('v_monthly_summary')
            .select('type, total')
            .eq('month', currentMonth)
            .eq('year', currentYear),
          supabase
            .from('v_monthly_summary')
            .select('type, total')
            .eq('month', prevMonth)
            .eq('year', prevYear),
          supabase
            .from('v_monthly_summary')
            .select('type, total'),
        ])

        if (currentRes.error) throw currentRes.error
        if (previousRes.error) throw previousRes.error
        if (allTimeRes.error) throw allTimeRes.error

        // Process stats helper
        const processStats = (rows: { type: string | null; total: number | null }[]) => {
          const result = { revenue: 0, variable_expense: 0, fixed_expense: 0, credit: 0, savings: 0 }
          for (const row of rows) {
            if (row.type && row.type in result) {
              result[row.type as keyof typeof result] += row.total || 0
            }
          }
          return result
        }

        const current = processStats(currentRes.data || [])
        const previous = processStats(previousRes.data || [])
        const allTime = processStats(allTimeRes.data || [])

        // Calculate KPIs
        const monthlyRevenue = current.revenue
        const monthlyExpenses = current.variable_expense + current.fixed_expense
        const monthlySavings = current.savings

        const prevRevenue = previous.revenue
        const prevExpenses = previous.variable_expense + previous.fixed_expense
        const prevSavings = previous.savings

        // Total balance = all-time revenue - all-time expenses - all-time credits + all-time savings
        const totalBalance =
          allTime.revenue -
          allTime.variable_expense -
          allTime.fixed_expense -
          allTime.credit

        // Previous month total balance (approximate trend via net monthly change)
        const currentNet = monthlyRevenue - monthlyExpenses - current.credit
        const prevNet = prevRevenue - prevExpenses - previous.credit

        // Trend calculations (null if no previous data)
        const calcTrend = (curr: number, prev: number): number | null => {
          if (prev === 0 && curr === 0) return 0
          if (prev === 0) return null
          return ((curr - prev) / Math.abs(prev)) * 100
        }

        setData({
          totalBalance,
          monthlyRevenue,
          monthlyExpenses,
          monthlySavings,
          revenueTrend: calcTrend(monthlyRevenue, prevRevenue),
          expensesTrend: calcTrend(monthlyExpenses, prevExpenses),
          savingsTrend: calcTrend(monthlySavings, prevSavings),
          balanceTrend: calcTrend(currentNet, prevNet),
        })
      } catch (err) {
        console.error('Error fetching KPIs:', err)
        setError('Erreur lors du chargement des indicateurs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchKPIs()
  }, [])

  if (isLoading) return <KPISkeleton />

  if (error) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const cards = [
    {
      title: 'Solde total',
      value: data.totalBalance,
      trend: data.balanceTrend,
      icon: Wallet,
      iconColor: 'text-violet-500',
      valueColor: data.totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      formatType: data.totalBalance >= 0 ? 'revenue' as const : 'variable_expense' as const,
    },
    {
      title: 'Revenus du mois',
      value: data.monthlyRevenue,
      trend: data.revenueTrend,
      icon: TrendingUp,
      iconColor: 'text-[hsl(var(--color-revenue))]',
      valueColor: 'text-[hsl(var(--color-revenue))]',
      formatType: 'revenue' as const,
    },
    {
      title: 'Depenses du mois',
      value: data.monthlyExpenses,
      trend: data.expensesTrend,
      icon: TrendingDown,
      iconColor: 'text-[hsl(var(--color-variable-expense))]',
      valueColor: 'text-[hsl(var(--color-variable-expense))]',
      formatType: 'variable_expense' as const,
    },
    {
      title: 'Epargne du mois',
      value: data.monthlySavings,
      trend: data.savingsTrend,
      icon: PiggyBank,
      iconColor: 'text-[hsl(var(--color-savings))]',
      valueColor: 'text-[hsl(var(--color-savings))]',
      formatType: 'revenue' as const,
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.title}
            className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.valueColor}`}>
                {formatCurrency(card.value, card.formatType)}
              </div>
              <TrendBadge value={card.trend} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
