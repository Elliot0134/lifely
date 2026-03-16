"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
} from "lucide-react"

type PeriodType = "month" | "quarter" | "year"

interface PeriodData {
  totalRevenue: number
  totalExpenses: number
  netBalance: number
}

function getPeriodRange(period: PeriodType, offset = 0): { from: string; to: string } {
  const now = new Date()

  if (period === "month") {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const from = date.toISOString().split("T")[0]
    const to = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0]
    return { from, to }
  }

  if (period === "quarter") {
    const currentQuarter = Math.floor(now.getMonth() / 3)
    const quarterStart = new Date(now.getFullYear(), (currentQuarter + offset) * 3, 1)
    const from = quarterStart.toISOString().split("T")[0]
    const to = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0)
      .toISOString()
      .split("T")[0]
    return { from, to }
  }

  // year
  const year = now.getFullYear() + offset
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

function getPeriodLabel(period: PeriodType): string {
  const now = new Date()
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ]

  if (period === "month") {
    return `${months[now.getMonth()]} ${now.getFullYear()}`
  }
  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3) + 1
    return `T${q} ${now.getFullYear()}`
  }
  return `${now.getFullYear()}`
}

function getVariationLabel(period: PeriodType): string {
  if (period === "month") return "vs mois précédent"
  if (period === "quarter") return "vs trimestre précédent"
  return "vs année précédente"
}

function computeVariation(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : current < 0 ? -100 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

async function fetchPeriodData(from: string, to: string): Promise<PeriodData> {
  const supabase = createClient()

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount, type")
    .gte("date", from)
    .lte("date", to)

  if (error) {
    console.error("Error fetching transactions:", error)
    return { totalRevenue: 0, totalExpenses: 0, netBalance: 0 }
  }

  let totalRevenue = 0
  let totalExpenses = 0

  for (const tx of transactions || []) {
    if (tx.type === "revenue") {
      totalRevenue += Number(tx.amount)
    } else {
      totalExpenses += Number(tx.amount)
    }
  }

  return {
    totalRevenue,
    totalExpenses,
    netBalance: totalRevenue - totalExpenses,
  }
}

function VariationBadge({
  variation,
  invertColor = false,
}: {
  variation: number | null
  invertColor?: boolean
}) {
  if (variation === null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        N/A
      </span>
    )
  }

  const isPositive = variation > 0
  const color = invertColor
    ? isPositive
      ? "text-red-500"
      : "text-emerald-500"
    : isPositive
      ? "text-emerald-500"
      : "text-red-500"

  const Icon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {isPositive ? "+" : ""}
      {variation.toFixed(1)}%
    </span>
  )
}

export type { PeriodType }

export function AnalyticsOverview({
  period,
  onPeriodChange,
}: {
  period: PeriodType
  onPeriodChange: (p: PeriodType) => void
}) {
  const setPeriod = onPeriodChange
  const [currentData, setCurrentData] = React.useState<PeriodData | null>(null)
  const [previousData, setPreviousData] = React.useState<PeriodData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)

      const current = getPeriodRange(period, 0)
      const previous = getPeriodRange(period, -1)

      const [cur, prev] = await Promise.all([
        fetchPeriodData(current.from, current.to),
        fetchPeriodData(previous.from, previous.to),
      ])

      if (!cancelled) {
        setCurrentData(cur)
        setPreviousData(prev)
        setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [period])

  const revenueVariation = currentData && previousData
    ? computeVariation(currentData.totalRevenue, previousData.totalRevenue)
    : null

  const expensesVariation = currentData && previousData
    ? computeVariation(currentData.totalExpenses, previousData.totalExpenses)
    : null

  const balanceVariation = currentData && previousData
    ? computeVariation(currentData.netBalance, previousData.netBalance)
    : null

  const periodButtons: { value: PeriodType; label: string }[] = [
    { value: "month", label: "Mois" },
    { value: "quarter", label: "Trimestre" },
    { value: "year", label: "Année" },
  ]

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {getPeriodLabel(period)}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {periodButtons.map((btn) => (
            <Button
              key={btn.value}
              variant={period === btn.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(btn.value)}
              className="text-xs"
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Revenue */}
          <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenus
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(currentData?.totalRevenue ?? 0)}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <VariationBadge variation={revenueVariation} />
                <span className="text-xs text-muted-foreground">
                  {getVariationLabel(period)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dépenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(currentData?.totalExpenses ?? 0)}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <VariationBadge variation={expensesVariation} invertColor />
                <span className="text-xs text-muted-foreground">
                  {getVariationLabel(period)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Net Balance */}
          <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634] sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Solde net
              </CardTitle>
              <Wallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  (currentData?.netBalance ?? 0) >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(currentData?.netBalance ?? 0)}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <VariationBadge variation={balanceVariation} />
                <span className="text-xs text-muted-foreground">
                  {getVariationLabel(period)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
