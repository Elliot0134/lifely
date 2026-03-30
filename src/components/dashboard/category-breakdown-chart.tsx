'use client'

import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface CategoryData {
  name: string
  value: number
  color: string
}

// Fallback palette when category has no color
const FALLBACK_COLORS = [
  '#f26a4b',   // orange
  '#8e8a83',  // blue
  '#c45c5c',    // red
  '#a89f8f',  // cyan
  '#5c5a56',  // purple
  '#d4a76a',   // amber
  '#7a6b5d',  // pink
  '#8b9a6b',  // green
]

function ChartSkeleton() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <Skeleton className="h-5 w-52" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}

function CustomTooltip({ active, payload }: {
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
        {formatCurrency(entry.value)}
      </p>
    </div>
  )
}

function CustomLegend({ payload }: {
  payload?: Array<{ value: string; color: string }>
}) {
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

export function CategoryBreakdownChart() {
  const [data, setData] = useState<CategoryData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        // First day and last day of current month
        const dateFrom = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
        const lastDay = new Date(currentYear, currentMonth, 0).getDate()
        const dateTo = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        // Fetch transactions for current month, expenses only
        const { data: transactions, error: dbError } = await supabase
          .from('transactions')
          .select('amount, type, category_id, categories(name, color)')
          .in('type', ['variable_expense', 'fixed_expense'])
          .gte('date', dateFrom)
          .lte('date', dateTo)

        if (dbError) throw dbError

        // Group by category
        const categoryMap = new Map<string, { name: string; total: number; color: string }>()

        for (const tx of transactions || []) {
          const catId = tx.category_id || 'uncategorized'
          const cat = tx.categories as unknown as { name: string; color: string } | null
          const catName = cat?.name || 'Sans catégorie'
          const catColor = cat?.color || ''

          const existing = categoryMap.get(catId)
          if (existing) {
            existing.total += tx.amount || 0
          } else {
            categoryMap.set(catId, {
              name: catName,
              total: tx.amount || 0,
              color: catColor,
            })
          }
        }

        // Sort by total descending, take top 7, rest as "Autres"
        const sorted = Array.from(categoryMap.values()).sort(
          (a, b) => b.total - a.total
        )

        const top = sorted.slice(0, 7)
        const rest = sorted.slice(7)
        const restTotal = rest.reduce((sum, c) => sum + c.total, 0)

        const chartData: CategoryData[] = top.map((c, i) => ({
          name: c.name,
          value: Math.abs(c.total),
          color: c.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        }))

        if (restTotal > 0) {
          chartData.push({
            name: 'Autres',
            value: Math.abs(restTotal),
            color: 'var(--muted-foreground)',
          })
        }

        setData(chartData)
      } catch (err) {
        console.error('Error fetching category breakdown:', err)
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

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base">Répartition des dépenses</CardTitle>
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
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              Aucune dépense ce mois-ci
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
