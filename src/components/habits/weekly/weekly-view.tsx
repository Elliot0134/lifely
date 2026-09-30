'use client'

import { useMemo } from 'react'
import { format, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HabitsEmptyState } from '@/components/habits/habits-empty-state'
import { WeeklyDayCards } from '@/components/habits/weekly/weekly-day-cards'
import { WeeklyHabitsTable } from '@/components/habits/weekly/weekly-habits-table'
import { WeeklyOverview } from '@/components/habits/weekly/weekly-overview'
import { useHabits, useWeekHabitCompletions } from '@/lib/queries/habits'

interface WeeklyViewProps {
  onAddClick?: () => void
}

export function WeeklyView({ onAddClick }: WeeklyViewProps) {
  const weekStart = useMemo(
    () =>
      format(
        startOfWeek(new Date(), { weekStartsOn: 1, locale: fr }),
        'yyyy-MM-dd',
      ),
    [],
  )

  const habitsQuery = useHabits()
  const completionsQuery = useWeekHabitCompletions(weekStart)

  const isLoading = habitsQuery.isLoading || completionsQuery.isLoading
  const hasError = habitsQuery.isError || completionsQuery.isError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[250px] w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Une erreur est survenue lors du chargement de vos habitudes.
        </p>
        <Button
          onClick={() => {
            habitsQuery.refetch()
            completionsQuery.refetch()
          }}
        >
          Réessayer
        </Button>
      </div>
    )
  }

  const habits = habitsQuery.data ?? []
  const completions = completionsQuery.data ?? []

  if (habits.length === 0) {
    return <HabitsEmptyState onAddClick={onAddClick} />
  }

  return (
    <div className="space-y-6">
      <WeeklyOverview
        habits={habits}
        completions={completions}
        weekStart={weekStart}
      />
      <WeeklyHabitsTable
        habits={habits}
        completions={completions}
        weekStart={weekStart}
      />
      <WeeklyDayCards
        habits={habits}
        completions={completions}
        weekStart={weekStart}
      />
    </div>
  )
}
