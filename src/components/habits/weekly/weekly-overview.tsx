'use client'

import { addDays, eachDayOfInterval, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { activeHabitsCount, totalActiveSlots } from '@/lib/habits'
import type { Habit, HabitCompletion } from '@/types/habit'

const HABIT_DONE_COLOR = 'hsl(var(--color-habit-done))'
const HABIT_DONE_MUTED = 'hsl(var(--color-habit-done) / 0.15)'

interface WeeklyOverviewProps {
  habits: Habit[]
  completions: HabitCompletion[]
  weekStart: string
}

interface DailyDatum {
  day: string
  count: number
  activeCount: number
}

export function WeeklyOverview({
  habits,
  completions,
  weekStart,
}: WeeklyOverviewProps) {
  if (habits.length === 0) {
    return null
  }

  const weekStartDate = new Date(weekStart)
  const days = eachDayOfInterval({
    start: weekStartDate,
    end: addDays(weekStartDate, 6),
  })

  const dailyData: DailyDatum[] = days.map((d) => {
    const iso = format(d, 'yyyy-MM-dd')
    const count = completions.filter((c) => c.completed_date === iso).length
    return {
      day: format(d, 'EEE', { locale: fr }),
      count,
      activeCount: activeHabitsCount(habits, d),
    }
  })

  const maxBarY = Math.max(1, ...dailyData.map((d) => d.activeCount))

  const totalCompletions = completions.length
  const totalSlots = totalActiveSlots(habits, days)
  const percent =
    totalSlots > 0 ? Math.round((totalCompletions / totalSlots) * 100) : 0

  const donutData = [
    { name: 'Complétées', value: percent },
    { name: 'Restantes', value: Math.max(0, 100 - percent) },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Progression globale</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="img"
            aria-label={`Graphique en barres de la progression hebdomadaire : ${dailyData
              .map((d) => `${d.day} ${d.count} sur ${d.activeCount}`)
              .join(', ')}`}
          >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={dailyData}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <XAxis
                dataKey="day"
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, maxBarY]}
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <Bar
                dataKey="count"
                fill={HABIT_DONE_COLOR}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Résumé</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative"
            role="img"
            aria-label={`Graphique en anneau : ${percent}% des habitudes complétées cette semaine, ${totalCompletions} sur ${totalSlots}`}
          >
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  <Cell fill={HABIT_DONE_COLOR} />
                  <Cell fill={HABIT_DONE_MUTED} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold tabular-nums">
                {percent}%
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {totalCompletions}/{totalSlots} Complétées
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
