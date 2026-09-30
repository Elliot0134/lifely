import { eachDayOfInterval, endOfMonth } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { totalActiveSlots } from '@/lib/habits'
import type { Habit, HabitCompletion } from '@/types/habit'

interface MonthlyStatsCardsProps {
  habits: Habit[]
  completions: HabitCompletion[]
  monthStart: string
}

export function MonthlyStatsCards({
  habits,
  completions,
  monthStart,
}: MonthlyStatsCardsProps) {
  if (habits.length === 0) {
    return null
  }

  const start = new Date(monthStart)
  const days = eachDayOfInterval({ start, end: endOfMonth(start) })
  const totalSlots = totalActiveSlots(habits, days)
  const percent = totalSlots > 0 ? (completions.length / totalSlots) * 100 : 0
  const percentRounded = percent.toFixed(2)
  const percentForBar = Math.min(100, Math.max(0, percent))

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-normal">
            Nombre d&apos;habitudes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{habits.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-normal">
            Habitudes complétées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{completions.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-normal">
            Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={percentForBar} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-normal">
            Progression en %
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{percentRounded}%</p>
        </CardContent>
      </Card>
    </div>
  )
}
