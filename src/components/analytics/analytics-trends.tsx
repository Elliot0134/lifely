"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"

type PeriodType = "month" | "quarter" | "year"

interface AnalyticsTrendsProps {
  period: PeriodType
}

interface TrendData {
  increasingCategory: { name: string; amount: number; change: number } | null
  decreasingCategory: { name: string; amount: number; change: number } | null
  busiestDay: { day: string; amount: number } | null
}

const DAY_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

function getPeriodDateRanges(period: PeriodType): {
  current: { from: string; to: string }
  previous: { from: string; to: string }
} {
  const now = new Date()

  if (period === "month") {
    const currentFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevTo = new Date(now.getFullYear(), now.getMonth(), 0)
    return {
      current: { from: fmt(currentFrom), to: fmt(currentTo) },
      previous: { from: fmt(prevFrom), to: fmt(prevTo) },
    }
  }

  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3)
    const currentFrom = new Date(now.getFullYear(), q * 3, 1)
    const currentTo = new Date(now.getFullYear(), q * 3 + 3, 0)
    const prevFrom = new Date(now.getFullYear(), q * 3 - 3, 1)
    const prevTo = new Date(now.getFullYear(), q * 3, 0)
    return {
      current: { from: fmt(currentFrom), to: fmt(currentTo) },
      previous: { from: fmt(prevFrom), to: fmt(prevTo) },
    }
  }

  // Year
  const currentFrom = new Date(now.getFullYear(), 0, 1)
  const currentTo = new Date(now.getFullYear(), 11, 31)
  const prevFrom = new Date(now.getFullYear() - 1, 0, 1)
  const prevTo = new Date(now.getFullYear() - 1, 11, 31)
  return {
    current: { from: fmt(currentFrom), to: fmt(currentTo) },
    previous: { from: fmt(prevFrom), to: fmt(prevTo) },
  }
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0]
}

function TrendSkeleton() {
  return (
    <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyTrendCard({ icon: Icon, label, color }: { icon: typeof TrendingUp; label: string; color: string }) {
  return (
    <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">Pas assez de donnees</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsTrends({ period }: AnalyticsTrendsProps) {
  const [data, setData] = useState<TrendData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchTrends() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { current, previous } = getPeriodDateRanges(period)

        // Fetch current period transactions
        const [currentRes, previousRes] = await Promise.all([
          supabase
            .from("transactions")
            .select("amount, type, date, category_id, categories(name)")
            .in("type", ["variable_expense", "fixed_expense"])
            .gte("date", current.from)
            .lte("date", current.to),
          supabase
            .from("transactions")
            .select("amount, type, category_id, categories(name)")
            .in("type", ["variable_expense", "fixed_expense"])
            .gte("date", previous.from)
            .lte("date", previous.to),
        ])

        if (currentRes.error) throw currentRes.error
        if (previousRes.error) throw previousRes.error

        const currentTx = currentRes.data || []
        const previousTx = previousRes.data || []

        // Aggregate by category for current period
        const currentByCategory = new Map<string, { name: string; total: number }>()
        for (const tx of currentTx) {
          const catId = tx.category_id || "uncategorized"
          const cat = tx.categories as unknown as { name: string } | null
          const catName = cat?.name || "Sans categorie"
          const existing = currentByCategory.get(catId)
          if (existing) {
            existing.total += Number(tx.amount) || 0
          } else {
            currentByCategory.set(catId, { name: catName, total: Number(tx.amount) || 0 })
          }
        }

        // Aggregate by category for previous period
        const previousByCategory = new Map<string, { name: string; total: number }>()
        for (const tx of previousTx) {
          const catId = tx.category_id || "uncategorized"
          const cat = tx.categories as unknown as { name: string } | null
          const catName = cat?.name || "Sans categorie"
          const existing = previousByCategory.get(catId)
          if (existing) {
            existing.total += Number(tx.amount) || 0
          } else {
            previousByCategory.set(catId, { name: catName, total: Number(tx.amount) || 0 })
          }
        }

        // Calculate changes
        const allCategoryIds = new Set([...currentByCategory.keys(), ...previousByCategory.keys()])
        const changes: { id: string; name: string; currentAmount: number; change: number }[] = []

        for (const catId of allCategoryIds) {
          const curr = currentByCategory.get(catId)
          const prev = previousByCategory.get(catId)
          const currentTotal = curr?.total || 0
          const previousTotal = prev?.total || 0
          const name = curr?.name || prev?.name || "Sans categorie"
          changes.push({
            id: catId,
            name,
            currentAmount: currentTotal,
            change: currentTotal - previousTotal,
          })
        }

        // Sort to find biggest increase and decrease
        const sorted = [...changes].sort((a, b) => b.change - a.change)
        const increasing = sorted.find((c) => c.change > 0) || null
        const decreasing = [...sorted].reverse().find((c) => c.change < 0) || null

        // Day of week with most spending (current period)
        const dayTotals = new Array(7).fill(0)
        for (const tx of currentTx) {
          const dayOfWeek = new Date(tx.date).getDay()
          dayTotals[dayOfWeek] += Math.abs(Number(tx.amount) || 0)
        }

        const maxDayIndex = dayTotals.reduce(
          (maxIdx, val, idx, arr) => (val > arr[maxIdx] ? idx : maxIdx),
          0
        )
        const maxDayAmount = dayTotals[maxDayIndex]

        const result: TrendData = {
          increasingCategory: increasing
            ? { name: increasing.name, amount: increasing.currentAmount, change: increasing.change }
            : null,
          decreasingCategory: decreasing
            ? { name: decreasing.name, amount: Math.abs(decreasing.currentAmount), change: decreasing.change }
            : null,
          busiestDay: maxDayAmount > 0 ? { day: DAY_LABELS[maxDayIndex], amount: maxDayAmount } : null,
        }

        if (!cancelled) setData(result)
      } catch (err) {
        console.error("Error fetching trends:", err)
        if (!cancelled) setData({ increasingCategory: null, decreasingCategory: null, busiestDay: null })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchTrends()
    return () => {
      cancelled = true
    }
  }, [period])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tendances</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <TrendSkeleton />
          <TrendSkeleton />
          <TrendSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tendances</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {/* Category increasing the most */}
        {data?.increasingCategory ? (
          <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{data.increasingCategory.name}</p>
                  <p className="text-xs text-muted-foreground">
                    En hausse de {formatCurrency(Math.abs(data.increasingCategory.change))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyTrendCard icon={TrendingUp} label="Categorie en hausse" color="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" />
        )}

        {/* Category decreasing the most */}
        {data?.decreasingCategory ? (
          <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{data.decreasingCategory.name}</p>
                  <p className="text-xs text-muted-foreground">
                    En baisse de {formatCurrency(Math.abs(data.decreasingCategory.change))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyTrendCard icon={TrendingDown} label="Categorie en baisse" color="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" />
        )}

        {/* Busiest day of week */}
        {data?.busiestDay ? (
          <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{data.busiestDay.day}</p>
                  <p className="text-xs text-muted-foreground">
                    Jour le plus depensier ({formatCurrency(data.busiestDay.amount)})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyTrendCard icon={Calendar} label="Jour le plus depensier" color="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
        )}
      </div>
    </div>
  )
}
