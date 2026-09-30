'use client'

import { useState } from 'react'
import { addMonths, format, startOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HabitsEmptyState } from '@/components/habits/habits-empty-state'
import { MonthlyAnalysePanel } from '@/components/habits/monthly/monthly-analyse-panel'
import { MonthlyGrid } from '@/components/habits/monthly/monthly-grid'
import { MonthlyProgressChart } from '@/components/habits/monthly/monthly-progress-chart'
import { MonthlyStatsCards } from '@/components/habits/monthly/monthly-stats-cards'
import { useHabits, useMonthHabitCompletions } from '@/lib/queries/habits'

interface MonthlyViewProps {
  onAddClick?: () => void
}

export function MonthlyView({ onAddClick }: MonthlyViewProps) {
  const [currentMonthStart, setCurrentMonthStart] = useState<string>(() =>
    format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  )

  const habitsQuery = useHabits()
  const completionsQuery = useMonthHabitCompletions(currentMonthStart)

  const prevMonth = () =>
    setCurrentMonthStart(
      format(subMonths(new Date(currentMonthStart), 1), 'yyyy-MM-dd'),
    )

  const nextMonth = () =>
    setCurrentMonthStart(
      format(addMonths(new Date(currentMonthStart), 1), 'yyyy-MM-dd'),
    )

  const rawTitle = format(new Date(currentMonthStart), 'MMMM yyyy', {
    locale: fr,
  })
  const monthTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1)

  const header = (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        onClick={prevMonth}
        aria-label="Mois précédent"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <h2 className="text-lg font-semibold capitalize">{monthTitle}</h2>
      <Button
        variant="ghost"
        size="icon"
        onClick={nextMonth}
        aria-label="Mois suivant"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )

  const isLoading = habitsQuery.isLoading || completionsQuery.isLoading
  const hasError = habitsQuery.isError || completionsQuery.isError

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[250px] w-full" />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        {header}
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
      {header}
      <MonthlyStatsCards
        habits={habits}
        completions={completions}
        monthStart={currentMonthStart}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <MonthlyGrid
          habits={habits}
          completions={completions}
          monthStart={currentMonthStart}
        />
        <MonthlyAnalysePanel
          habits={habits}
          completions={completions}
          monthStart={currentMonthStart}
        />
      </div>
      <MonthlyProgressChart
        habits={habits}
        completions={completions}
        monthStart={currentMonthStart}
      />
    </div>
  )
}
