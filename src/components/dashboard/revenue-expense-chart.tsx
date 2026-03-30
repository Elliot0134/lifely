'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface MonthlyData {
  label: string
  revenue: number
  expenses: number
}

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
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

function CustomTooltip({ active, payload, label }: {
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
            {entry.dataKey === 'revenue' ? 'Revenus' : 'Dépenses'} :
          </span>
          <span className="font-medium">
            {formatCurrency(entry.value)}
          </span>
        </p>
      ))}
    </div>
  )
}

export function RevenueExpenseChart() {
  const [data, setData] = useState<MonthlyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()
        const now = new Date()

        // Build last 6 months range
        const months: { month: number; year: number }[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months.push({ month: d.getMonth() + 1, year: d.getFullYear() })
        }

        const firstMonth = months[0]
        const lastMonth = months[months.length - 1]

        // Fetch all data for the 6-month range
        const { data: rows, error: dbError } = await supabase
          .from('v_monthly_summary')
          .select('type, total, month, year')
          .or(
            months
              .map((m) => `and(month.eq.${m.month},year.eq.${m.year})`)
              .join(',')
          )

        if (dbError) throw dbError

        // Aggregate by month
        const monthMap = new Map<string, { revenue: number; expenses: number }>()
        for (const m of months) {
          monthMap.set(`${m.year}-${m.month}`, { revenue: 0, expenses: 0 })
        }

        for (const row of rows || []) {
          const key = `${row.year}-${row.month}`
          const entry = monthMap.get(key)
          if (!entry) continue

          const amount = row.total || 0
          if (row.type === 'revenue') {
            entry.revenue += amount
          } else if (
            row.type === 'variable_expense' ||
            row.type === 'fixed_expense'
          ) {
            entry.expenses += amount
          }
        }

        const chartData: MonthlyData[] = months.map((m) => {
          const entry = monthMap.get(`${m.year}-${m.month}`)!
          return {
            label: `${MONTH_LABELS[m.month - 1]} ${m.year !== now.getFullYear() ? m.year : ''}`.trim(),
            revenue: entry.revenue,
            expenses: entry.expenses,
          }
        })

        setData(chartData)
      } catch (err) {
        console.error('Error fetching revenue/expense chart:', err)
        setError('Erreur lors du chargement du graphique')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) return <ChartSkeleton />

  if (error) {
    return (
      <Card className="bg-card">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const hasData = data.some((d) => d.revenue > 0 || d.expenses > 0)

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base">Revenus vs Dépenses</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b9a6b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b9a6b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f26a4b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f26a4b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="label"
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k€` : `${v}€`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) =>
                  value === 'revenue' ? 'Revenus' : 'Dépenses'
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8b9a6b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#f26a4b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpenses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              Aucune donnée sur les 6 derniers mois
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
