'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  createHabitSchema,
  reorderHabitsSchema,
  updateHabitSchema,
  type HabitFormInput,
} from '@/lib/validations/habit'
import type { Habit } from '@/types/habit'

interface ActionResponse<T = Habit> {
  success: boolean
  data?: T
  error?: string
}

const toggleCompletionSchema = z.object({
  habitId: z.string().uuid({ message: "ID d'habitude invalide" }),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Date invalide (format YYYY-MM-DD attendu)',
    }),
})

export async function createHabit(
  input: HabitFormInput
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validate input
    const validated = createHabitSchema.parse(input)

    // Insert habit with user_id from authenticated session
    const { data, error } = await supabase
      .from('habits')
      .insert({
        ...validated,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/habits')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur création habit:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function updateHabit(
  id: string,
  input: Partial<HabitFormInput>
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    if (!id || typeof id !== 'string') {
      throw new Error('ID invalide')
    }

    // Validate input
    const validated = updateHabitSchema.parse(input)

    // Update habit (RLS enforces ownership, explicit user_id filter for defense-in-depth)
    const { data, error } = await supabase
      .from('habits')
      .update(validated)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/habits')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur mise à jour habit:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function archiveHabit(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    if (!id || typeof id !== 'string') {
      throw new Error('ID invalide')
    }

    // Soft delete: set archived_at (NO DELETE)
    const { data, error } = await supabase
      .from('habits')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/habits')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur archivage habit:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function deleteHabit(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    if (!id || typeof id !== 'string') {
      throw new Error('ID invalide')
    }

    // Hard delete habit. habit_completions are auto-cascade-deleted via FK.
    // Defense-in-depth : explicit user_id filter even though RLS enforces ownership.
    const { data, error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/habits')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur suppression habit:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function reorderHabits(
  orderedIds: string[]
): Promise<ActionResponse<{ count: number }>> {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validate input
    const validatedIds = reorderHabitsSchema.parse(orderedIds)

    // Batch update : loop (N typically < 50 per user)
    // Defense-in-depth : explicit user_id filter even though RLS enforces ownership
    for (let i = 0; i < validatedIds.length; i++) {
      const { error: updateError } = await supabase
        .from('habits')
        .update({ order_index: i })
        .eq('id', validatedIds[i])
        .eq('user_id', user.id)

      if (updateError) {
        throw new Error(updateError.message)
      }
    }

    revalidatePath('/habits')

    return { success: true, data: { count: validatedIds.length } }
  } catch (error) {
    console.error('Erreur réordonnement habits:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function toggleCompletion(
  habitId: string,
  date: string
): Promise<ActionResponse<{ completed: boolean }>> {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validate input
    const { habitId: validHabitId, date: validDate } =
      toggleCompletionSchema.parse({ habitId, date })

    // Defense-in-depth : ensure the date's weekday is part of the habit's
    // active_days. UI prevents this but a stale tab or direct call could
    // bypass it.
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('active_days')
      .eq('id', validHabitId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (habitError) {
      throw new Error(habitError.message)
    }
    if (!habit) {
      throw new Error('Habitude introuvable')
    }

    // getDay() on YYYY-MM-DD parsed at UTC midnight returns weekday in UTC.
    // We want local-day semantics consistent with `new Date().getDay()` used
    // in the UI. Parse explicit Y-M-D components to build a local date.
    const [y, m, d] = validDate.split('-').map(Number)
    const localDate = new Date(y, m - 1, d)
    const dow = localDate.getDay()
    if (!habit.active_days.includes(dow)) {
      return {
        success: false,
        error: 'Jour inactif pour cette habitude',
      }
    }

    // Check if completion already exists for this (habit, date, user)
    // Defense-in-depth: explicit user_id filter even though RLS enforces ownership
    const { data: existing, error: selectError } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('habit_id', validHabitId)
      .eq('completed_date', validDate)
      .eq('user_id', user.id)
      .maybeSingle()

    if (selectError) {
      throw new Error(selectError.message)
    }

    if (existing) {
      // DELETE: completion exists, undo it
      const { error: deleteError } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', existing.id)
        .eq('user_id', user.id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      revalidatePath('/habits')

      return { success: true, data: { completed: false } }
    }

    // INSERT: no completion yet, mark as done
    const { error: insertError } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: validHabitId,
        user_id: user.id,
        completed_date: validDate,
      })

    if (insertError) {
      // Handle UNIQUE constraint violation (race condition: another client
      // inserted between our SELECT and INSERT). Treat as "already toggled on".
      if (insertError.code === '23505') {
        revalidatePath('/habits')
        return { success: true, data: { completed: true } }
      }
      throw new Error(insertError.message)
    }

    revalidatePath('/habits')

    return { success: true, data: { completed: true } }
  } catch (error) {
    console.error('Erreur toggle completion:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
