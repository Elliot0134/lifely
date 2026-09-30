'use client'

import { eachDayOfInterval, endOfMonth } from 'date-fns'
import { ChevronDown } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { habitActiveDaysCount } from '@/lib/habits'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Habit, HabitCompletion } from '@/types/habit'

interface MonthlyAnalysePanelProps {
  habits: Habit[]
  completions: HabitCompletion[]
  monthStart: string
}

interface HabitStat {
  habit: Habit
  objective: number
  real: number
  pct: number
}

function HabitRow({ stat }: { stat: HabitStat }) {
  const { habit, objective, real, pct } = stat
  const progressColor = habit.color ?? 'var(--color-habit-done)'

  return (
    <div className="grid grid-cols-[1fr_50px_50px_100px] md:grid-cols-[1fr_60px_60px_120px] gap-2 items-center text-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">
                {habit.emoji ?? '✨'}
              </span>
              <span className="truncate">{habit.name}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{habit.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="text-center text-muted-foreground tabular-nums">
        {objective}
      </div>

      <div className="text-center font-medium tabular-nums">{real}</div>

      <div className="flex items-center gap-2">
        <Progress
          value={pct}
          className="h-2 flex-1"
          style={
            {
              ['--progress-color' as string]: progressColor,
            } as React.CSSProperties
          }
        />
        <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
          {pct}%
        </span>
      </div>
    </div>
  )
}

function HeaderRow() {
  return (
    <div className="grid grid-cols-[1fr_50px_50px_100px] md:grid-cols-[1fr_60px_60px_120px] gap-2 items-center text-xs text-muted-foreground font-medium pb-2 border-b">
      <div>Habitude</div>
      <div className="text-center">Objectif</div>
      <div className="text-center">Réel</div>
      <div>Progression</div>
    </div>
  )
}

function PanelBody({ habitsWithStats }: { habitsWithStats: HabitStat[] }) {
  return (
    <div className="space-y-3">
      <HeaderRow />
      <div className="space-y-2">
        {habitsWithStats.map((stat) => (
          <HabitRow key={stat.habit.id} stat={stat} />
        ))}
      </div>
    </div>
  )
}

export function MonthlyAnalysePanel({
  habits,
  completions,
  monthStart,
}: MonthlyAnalysePanelProps) {
  if (habits.length === 0) {
    return null
  }

  const start = new Date(monthStart)
  const days = eachDayOfInterval({ start, end: endOfMonth(start) })

  const habitsWithStats: HabitStat[] = habits.map((h) => {
    const real = completions.filter((c) => c.habit_id === h.id).length
    const objective = habitActiveDaysCount(h, days)
    const pct = objective > 0 ? Math.round((real / objective) * 100) : 0
    return { habit: h, objective, real, pct }
  })

  return (
    <Card>
      {/* Mobile : collapsible via <details> */}
      <details className="md:hidden group" open={false}>
        <summary className="list-none cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Analyse mensuelle</CardTitle>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </CardHeader>
        </summary>
        <CardContent>
          <PanelBody habitsWithStats={habitsWithStats} />
        </CardContent>
      </details>

      {/* Desktop : toujours visible */}
      <div className="hidden md:block">
        <CardHeader>
          <CardTitle>Analyse mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <PanelBody habitsWithStats={habitsWithStats} />
        </CardContent>
      </div>
    </Card>
  )
}
