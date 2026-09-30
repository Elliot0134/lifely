// types/habit.ts
import type { Database } from './database.types'

export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitCompletion = Database['public']['Tables']['habit_completions']['Row']

export type CreateHabitInput = Database['public']['Tables']['habits']['Insert']
export type UpdateHabitInput = Database['public']['Tables']['habits']['Update']

export type HabitWithCompletions = Habit & { completions: HabitCompletion[] }
