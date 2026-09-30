'use client'

import { addDays, eachDayOfInterval, format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { Check } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToggleCompletion } from '@/lib/queries/habits'
import { isHabitActiveOnDate } from '@/lib/habits'
import { cn } from '@/lib/utils'
import type { Habit, HabitCompletion } from '@/types/habit'

const HABIT_DONE_COLOR = 'hsl(var(--color-habit-done))'
const HABIT_DONE_MUTED = 'hsl(var(--color-habit-done) / 0.15)'

interface WeeklyDayCardsProps {
  habits: Habit[]
  completions: HabitCompletion[]
  weekStart: string
}

export function WeeklyDayCards({
  habits,
  completions,
  weekStart,
}: WeeklyDayCardsProps) {
  const toggle = useToggleCompletion()

  if (habits.length === 0) {
    return null
  }

  const weekStartDate = new Date(weekStart)
  const days = eachDayOfInterval({
    start: weekStartDate,
    end: addDays(weekStartDate, 6),
  })

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {days.map((d) => {
        const iso = format(d, 'yyyy-MM-dd')
        const activeHabits = habits.filter((h) => isHabitActiveOnDate(h, d))
        const totalHabits = activeHabits.length
        const dayCompletions = completions.filter(
          (c) => c.completed_date === iso,
        )
        const completedHabitIds = new Set(dayCompletions.map((c) => c.habit_id))
        // Restrict completed-count to currently-active habits so toggling an
        // off-day cell (shouldn't be possible via UI) doesn't inflate the %.
        const completedCount = activeHabits.reduce(
          (acc, h) => acc + (completedHabitIds.has(h.id) ? 1 : 0),
          0,
        )
        const remaining = Math.max(0, totalHabits - completedCount)
        const percent =
          totalHabits > 0
            ? Math.round((completedCount / totalHabits) * 100)
            : 0
        const today = isToday(d)

        const donutData = [
          { name: 'Complétées', value: percent },
          { name: 'Restantes', value: Math.max(0, 100 - percent) },
        ]

        return (
          <Card
            key={iso}
            className={cn(
              'bg-card',
              today && 'ring-2 ring-[hsl(var(--color-habit-done))]',
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm capitalize">
                  <div className="flex flex-col">
                    <span className="font-semibold leading-tight">
                      {format(d, 'EEEE', { locale: fr })}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {format(d, 'dd.MM.yyyy')}
                    </span>
                  </div>
                </CardTitle>
                <div
                  className="relative h-[92px] w-[92px] shrink-0"
                  role="img"
                  aria-label={`${percent}% complété, ${completedCount} habitudes sur ${totalHabits}`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
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
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold tabular-nums">
                      {percent}%
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="space-y-0.5">
                {activeHabits.map((habit) => {
                  const checked = completedHabitIds.has(habit.id)
                  return (
                    <li key={habit.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        aria-label={`${habit.name} — ${format(d, 'EEEE d MMMM', { locale: fr })}`}
                        onClick={() =>
                          toggle.mutate({ habitId: habit.id, date: iso })
                        }
                        className="flex w-full min-h-[44px] items-center gap-2 overflow-hidden rounded-md px-1 -mx-1 text-left transition-colors hover:bg-muted/50 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-habit-done))]/50"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150',
                            checked
                              ? 'border-transparent bg-[hsl(var(--color-habit-done))] text-white shadow-sm'
                              : 'border-border bg-transparent',
                          )}
                        >
                          {checked && (
                            <Check size={10} strokeWidth={3} aria-hidden="true" />
                          )}
                        </span>
                        {habit.emoji && (
                          <span
                            className="text-sm leading-none"
                            aria-hidden="true"
                          >
                            {habit.emoji}
                          </span>
                        )}
                        <span className="truncate text-xs font-medium">
                          {habit.name}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div className="flex justify-between border-t pt-2 text-[11px] text-muted-foreground">
                <span>Fait {completedCount}</span>
                <span>Restant {remaining}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
