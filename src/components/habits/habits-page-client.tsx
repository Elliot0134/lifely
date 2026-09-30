'use client'

import { useSearchParams } from 'next/navigation'

import { MonthlyView } from '@/components/habits/monthly/monthly-view'
import { WeeklyView } from '@/components/habits/weekly/weekly-view'

/**
 * Client wrapper for the habits page body.
 * Reads `?view=week|month` from URL and renders the corresponding view.
 *
 * NOTE: The empty-state "Ajouter une habitude" button is intentionally NOT wired
 * to a modal here — users can use the "Ajouter une habitude" button in the page
 * header instead. Wiring the empty-state CTA to a controlled modal is deferred
 * (would require a second HabitFormModal instance + state lifted here).
 */
export function HabitsPageClient() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') === 'month' ? 'month' : 'week'

  return view === 'week' ? <WeeklyView /> : <MonthlyView />
}
