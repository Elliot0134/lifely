import type { Habit } from '@/types/habit'

/**
 * Day-of-week convention (matches native `Date.prototype.getDay()` AND
 * date-fns' `getDay()`):
 *
 *   0 = Dimanche (Sunday)
 *   1 = Lundi    (Monday)
 *   2 = Mardi    (Tuesday)
 *   3 = Mercredi (Wednesday)
 *   4 = Jeudi    (Thursday)
 *   5 = Vendredi (Friday)
 *   6 = Samedi   (Saturday)
 *
 * Stored in `habits.active_days SMALLINT[]` — must contain at least 1
 * value, all in [0,6].
 */

/** Returns true if the habit should be tracked on the given local date. */
export function isHabitActiveOnDate(habit: Habit, date: Date): boolean {
  return habit.active_days.includes(date.getDay())
}

/** Count of habits active on a given date (denominator for day-level %). */
export function activeHabitsCount(habits: Habit[], date: Date): number {
  const dow = date.getDay()
  return habits.reduce((acc, h) => acc + (h.active_days.includes(dow) ? 1 : 0), 0)
}

/** Count of active days for a single habit across a list of dates. */
export function habitActiveDaysCount(habit: Habit, dates: Date[]): number {
  return dates.reduce(
    (acc, d) => acc + (habit.active_days.includes(d.getDay()) ? 1 : 0),
    0,
  )
}

/** Sum over a date range of "how many habits are active that day". */
export function totalActiveSlots(habits: Habit[], dates: Date[]): number {
  return dates.reduce((acc, d) => acc + activeHabitsCount(habits, d), 0)
}
