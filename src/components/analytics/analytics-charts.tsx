"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"

type PeriodType = "month" | "quarter" | "year"

interface AnalyticsChartsProps {
  period: PeriodType
}

// ---------- Shared helpers ----------

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aout", "Sep", "Oct", "Nov", "Dec",
]

const FALLBACK_COLORS = [
  "#f26a4b",
  "#8e8a83",
  "#c45c5c",
  "#a89f8f",
  "#5c5a56",
  "#d4a76a",
  "#7a6b5d",
  "#8b9a6b",
]

function ChartSkeleton() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

function getMonthsForPeriod(period: PeriodType): { month: number; year: number }[] {
  const now = new Date()

  if (period === "month") {
    // Show last 6 months
    const months: { month: number; year: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ month: d.getMonth() + 1, year: d.getFullYear() })
    }
    return months
  }

  if (period === "quarter") {
    // Show last 4 quarters (12 months)
    const months: { month: number; year: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ month: d.getMonth() + 1, year: d.getFullYear() })
    }
    return months
  }

  // Year: all 12 months of current year
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    year: now.getFullYear(),
  }))
}

function getPeriodDateRange(period: PeriodType): { from: string; to: string } {
  const now = new Date()

  if (period === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] }
  }

  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3)
    const from = new Date(now.getFullYear(), q * 3, 1)
    const to = new Date(now.getFullYear(), q * 3 + 3, 0)
    return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] }
  }

  return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` }
}

// ---------- 1. Monthly Revenue vs Expenses Bar Chart ----------

interface MonthlyBarData {
  label: string
  revenue: number
  expenses: number
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-background border rounded-lg shadow-md p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.dataKey === "revenue" ? "Revenus" : "Depenses"} :
          </span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

function MonthlyEvolutionChart({ period }: { period: PeriodType }) {
  const [data, setData] = useState<MonthlyBarData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const months = getMonthsForPeriod(period)

        const { data: rows, error } = await supabase
          .from("transactions")
          .select("amount, type, date")
          .gte("date", `${months[0].year}-${String(months[0].month).padStart(2, "0")}-01`)
          .lte(
            "date",
            (() => {
              const last = months[months.length - 1]
              const lastDay = new Date(last.year, last.month, 0).getDate()
              return `${last.year}-${String(last.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
            })()
          )

        if (error) throw error

        // Aggregate by month
        const monthMap = new Map<string, { revenue: number; expenses: number }>()
        for (const m of months) {
          monthMap.set(`${m.year}-${m.month}`, { revenue: 0, expenses: 0 })
        }

        for (const tx of rows || []) {
          const d = new Date(tx.date)
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`
          const entry = monthMap.get(key)
          if (!entry) continue

          if (tx.type === "revenue") {
            entry.revenue += Number(tx.amount) || 0
          } else {
            entry.expenses += Number(tx.amount) || 0
          }
        }

        const now = new Date()
        const chartData: MonthlyBarData[] = months.map((m) => {
          const entry = monthMap.get(`${m.year}-${m.month}`)!
          const yearSuffix = m.year !== now.getFullYear() ? ` ${m.year}` : ""
          return {
            label: `${MONTH_LABELS[m.month - 1]}${yearSuffix}`,
            revenue: entry.revenue,
            expenses: entry.expenses,
          }
        })

        if (!cancelled) setData(chartData)
      } catch (err) {
        console.error("Error fetching monthly evolution:", err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [period])

  if (isLoading) return <ChartSkeleton />

  const hasData = data.some((d) => d.revenue > 0 || d.expenses > 0)

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base">Evolution mensuelle</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="label"
                fontSize={12}
                tick={{ fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tick={{ fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                }
              />
              <Tooltip content={<BarTooltip />} />
              <Legend
                formatter={(value: string) =>
                  value === "revenue" ? "Revenus" : "Depenses"
                }
              />
              <Bar dataKey="revenue" fill="#8b9a6b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#f26a4b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="Aucune donnee pour cette periode" />
        )}
      </CardContent>
    </Card>
  )
}

// ---------- 2. Donut Chart: Expense Breakdown by Category ----------

interface CategoryData {
  name: string
  value: number
  color: string
  percentage: number
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: CategoryData }>
}) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  return (
    <div className="bg-background border rounded-lg shadow-md p-3 text-sm">
      <p className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span className="font-medium">{entry.name}</span>
      </p>
      <p className="text-muted-foreground mt-1">
        {formatCurrency(entry.value)} ({entry.payload.percentage.toFixed(1)}%)
      </p>
    </div>
  )
}

function DonutLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function CategoryDonutChart({ period }: { period: PeriodType }) {
  const [data, setData] = useState<CategoryData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { from, to } = getPeriodDateRange(period)

        const { data: transactions, error } = await supabase
          .from("transactions")
          .select("amount, type, category_id, categories(name, color)")
          .in("type", ["variable_expense", "fixed_expense"])
          .gte("date", from)
          .lte("date", to)

        if (error) throw error

        const categoryMap = new Map<string, { name: string; total: number; color: string }>()

        for (const tx of transactions || []) {
          const catId = tx.category_id || "uncategorized"
          const cat = tx.categories as unknown as { name: string; color: string } | null
          const catName = cat?.name || "Sans categorie"
          const catColor = cat?.color || ""

          const existing = categoryMap.get(catId)
          if (existing) {
            existing.total += Number(tx.amount) || 0
          } else {
            categoryMap.set(catId, {
              name: catName,
              total: Number(tx.amount) || 0,
              color: catColor,
            })
          }
        }

        const sorted = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total)
        const top = sorted.slice(0, 7)
        const rest = sorted.slice(7)
        const restTotal = rest.reduce((sum, c) => sum + c.total, 0)
        const grandTotal = sorted.reduce((sum, c) => sum + c.total, 0) || 1

        const chartData: CategoryData[] = top.map((c, i) => ({
          name: c.name,
          value: Math.abs(c.total),
          color: c.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
          percentage: (Math.abs(c.total) / grandTotal) * 100,
        }))

        if (restTotal > 0) {
          chartData.push({
            name: "Autres",
            value: Math.abs(restTotal),
            color: "var(--muted-foreground)",
            percentage: (Math.abs(restTotal) / grandTotal) * 100,
          })
        }

        if (!cancelled) setData(chartData)
      } catch (err) {
        console.error("Error fetching category breakdown:", err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [period])

  if (isLoading) return <ChartSkeleton />

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base">Repartition des depenses</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
              <Legend content={<DonutLegend />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="Aucune depense pour cette periode" />
        )}
      </CardContent>
    </Card>
  )
}

// ---------- 3. Top 5 Expense Categories - Horizontal Bar Chart ----------

interface TopCategoryData {
  name: string
  amount: number
  color: string
}

function TopCategoryTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: TopCategoryData }>
}) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  return (
    <div className="bg-background border rounded-lg shadow-md p-3 text-sm">
      <p className="font-medium">{entry.payload.name}</p>
      <p className="text-muted-foreground mt-1">{formatCurrency(entry.value)}</p>
    </div>
  )
}

function TopCategoriesChart({ period }: { period: PeriodType }) {
  const [data, setData] = useState<TopCategoryData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { from, to } = getPeriodDateRange(period)

        const { data: transactions, error } = await supabase
          .from("transactions")
          .select("amount, type, category_id, categories(name, color)")
          .in("type", ["variable_expense", "fixed_expense"])
          .gte("date", from)
          .lte("date", to)

        if (error) throw error

        const categoryMap = new Map<string, { name: string; total: number; color: string }>()

        for (const tx of transactions || []) {
          const catId = tx.category_id || "uncategorized"
          const cat = tx.categories as unknown as { name: string; color: string } | null
          const catName = cat?.name || "Sans categorie"
          const catColor = cat?.color || ""

          const existing = categoryMap.get(catId)
          if (existing) {
            existing.total += Number(tx.amount) || 0
          } else {
            categoryMap.set(catId, {
              name: catName,
              total: Number(tx.amount) || 0,
              color: catColor,
            })
          }
        }

        const sorted = Array.from(categoryMap.values())
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)

        const chartData: TopCategoryData[] = sorted.map((c, i) => ({
          name: c.name,
          amount: Math.abs(c.total),
          color: c.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        }))

        if (!cancelled) setData(chartData)
      } catch (err) {
        console.error("Error fetching top categories:", err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [period])

  if (isLoading) return <ChartSkeleton />

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base">Top 5 depenses par categorie</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
              <XAxis
                type="number"
                fontSize={12}
                tick={{ fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                fontSize={12}
                tick={{ fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip content={<TopCategoryTooltip />} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="Aucune depense pour cette periode" />
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Main Export ----------

export function AnalyticsCharts({ period }: AnalyticsChartsProps) {
  return (
    <div className="space-y-4">
      {/* Full-width: Monthly Evolution */}
      <MonthlyEvolutionChart period={period} />

      {/* Two-column grid: Donut + Top Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        <CategoryDonutChart period={period} />
        <TopCategoriesChart period={period} />
      </div>
    </div>
  )
}
