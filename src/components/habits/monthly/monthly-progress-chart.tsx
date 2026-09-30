'use client'

import { eachDayOfInterval, endOfMonth, format } from 'date-fns'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { activeHabitsCount, isHabitActiveOnDate } from '@/lib/habits'
import type { Habit, HabitCompletion } from '@/types/habit'

interface MonthlyProgressChartProps {
  habits: Habit[]
  completions: HabitCompletion[]
  monthStart: string
}

interface TooltipPayloadItem {
  value: number
  payload: { day: string; pct: number }
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const { day, pct } = payload[0].payload

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">
        {day} — {pct}%
      </p>
    </div>
  )
}

export function MonthlyProgressChart({
  habits,
  completions,
  monthStart,
}: MonthlyProgressChartProps) {
  if (habits.length === 0) {
    return null
  }

  const start = new Date(monthStart)
  const days = eachDayOfInterval({ start, end: endOfMonth(start) })

  const data = days.map((d) => {
    const iso = format(d, 'yyyy-MM-dd')
    const activeCount = activeHabitsCount(habits, d)
    // Only count completions for habits that are active that day, so a
    // stale completion on an off-day doesn't push the % above 100.
    const done = habits.reduce((acc, h) => {
      if (!isHabitActiveOnDate(h, d)) return acc
      return acc + (completions.some(
        (c) => c.habit_id === h.id && c.completed_date === iso,
      ) ? 1 : 0)
    }, 0)
    const pct = activeCount > 0 ? Math.round((done / activeCount) * 100) : 0
    return { day: format(d, 'd'), pct }
  })

  const avgPct =
    data.length > 0
      ? Math.round(data.reduce((acc, d) => acc + d.pct, 0) / data.length)
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progression mensuelle</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="h-[250px] w-full"
          role="img"
          aria-label={`Graphique d'aire de la progression mensuelle. Moyenne de ${avgPct}% sur ${data.length} jours.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="habit-progress-gradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--color-habit-done))"
                    stopOpacity={0.6}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--color-habit-done))"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="day"
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value: number) => `${value}%`}
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="hsl(var(--color-habit-done))"
                strokeWidth={2}
                fill="url(#habit-progress-gradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
