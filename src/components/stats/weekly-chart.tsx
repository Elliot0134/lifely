'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { TaskStats } from '@/types/tasks'

interface WeeklyChartProps {
  weeklyData: TaskStats['weekly_data'] | undefined
  isLoading: boolean
}

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
            {entry.dataKey === 'completed' ? 'Completees' : 'Creees'} :
          </span>
          <span className="font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function formatWeekLabel(weekStart: string): string {
  const date = new Date(weekStart)
  const day = date.getDate()
  const month = date.toLocaleDateString('fr-FR', { month: 'short' })
  return `${day} ${month}`
}

export function WeeklyChart({ weeklyData, isLoading }: WeeklyChartProps) {
  if (isLoading) return <ChartSkeleton />

  const data = (weeklyData ?? []).map((w) => ({
    label: formatWeekLabel(w.week_start),
    completed: w.completed,
    created: w.created,
  }))

  const hasData = data.some((d) => d.completed > 0 || d.created > 0)

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base">Activite hebdomadaire</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) =>
                  value === 'completed' ? 'Completees' : 'Creees'
                }
              />
              <Bar
                dataKey="completed"
                fill="#8b9a6b"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="created"
                fill="#8e8a83"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              Aucune donnee sur les 4 dernieres semaines
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
