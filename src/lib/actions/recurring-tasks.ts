'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createRecurringTaskSchema,
  updateRecurringTaskSchema,
} from '@/lib/validations/tasks'
import type {
  CreateRecurringTaskInput,
  UpdateRecurringTaskInput,
  TaskRecurrenceFrequency,
} from '@/types/tasks'

// ── Helpers ────────────────────────────────────────────────────

function advanceDate(
  dateStr: string,
  frequency: TaskRecurrenceFrequency
): string {
  const date = new Date(dateStr + 'T00:00:00')

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
  }

  return date.toISOString().split('T')[0]
}

// ── Create ─────────────────────────────────────────────────────

export async function createRecurringTask(input: CreateRecurringTaskInput) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const validated = createRecurringTaskSchema.parse(input)

    const startDate =
      validated.start_date ?? new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('recurring_tasks')
      .insert({
        title: validated.title,
        description: validated.description ?? null,
        project_id: validated.project_id ?? null,
        is_code_task: validated.is_code_task ?? false,
        is_urgent: validated.is_urgent ?? false,
        is_important: validated.is_important ?? false,
        estimated_minutes: validated.estimated_minutes ?? null,
        ai_instructions: validated.ai_instructions ?? null,
        frequency: validated.frequency,
        day_of_week: validated.day_of_week ?? null,
        day_of_month: validated.day_of_month ?? null,
        month_of_year: validated.month_of_year ?? null,
        start_date: startDate,
        end_date: validated.end_date ?? null,
        next_due_date: startDate,
        is_active: true,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/tasks')

    return { success: true as const, data }
  } catch (error) {
    console.error('Erreur création recurring task:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

// ── Update ─────────────────────────────────────────────────────

export async function updateRecurringTask(input: UpdateRecurringTaskInput) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const validated = updateRecurringTaskSchema.parse(input)
    const { id, ...updates } = validated

    const { data, error } = await supabase
      .from('recurring_tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/tasks')

    return { success: true as const, data }
  } catch (error) {
    console.error('Erreur mise à jour recurring task:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

// ── Delete ─────────────────────────────────────────────────────

export async function deleteRecurringTask(id: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const { error } = await supabase
      .from('recurring_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/tasks')

    return { success: true as const }
  } catch (error) {
    console.error('Erreur suppression recurring task:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

// ── Generate Due Tasks ─────────────────────────────────────────

export async function generateDueTasks() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const today = new Date().toISOString().split('T')[0]

    // 1. Find all active recurring tasks where next_due_date <= today
    const { data: dueTasks, error: fetchError } = await supabase
      .from('recurring_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lte('next_due_date', today)

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (!dueTasks || dueTasks.length === 0) {
      return { success: true as const, generated: 0 }
    }

    let generated = 0

    for (const recurring of dueTasks) {
      // 2. Create a task from the template
      const { error: insertError } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: recurring.title,
        description: recurring.description,
        project_id: recurring.project_id,
        is_code_task: recurring.is_code_task,
        is_urgent: recurring.is_urgent,
        is_important: recurring.is_important,
        estimated_minutes: recurring.estimated_minutes,
        ai_instructions: recurring.ai_instructions,
        due_date: recurring.next_due_date,
        status: 'todo',
        sort_order: 0,
      })

      if (insertError) {
        console.error(
          `Erreur génération tâche pour recurring ${recurring.id}:`,
          insertError
        )
        continue
      }

      // 3. Calculate new next_due_date
      const newNextDueDate = advanceDate(
        recurring.next_due_date,
        recurring.frequency as TaskRecurrenceFrequency
      )

      // 4. Update recurring task
      const updatePayload: Record<string, unknown> = {
        next_due_date: newNextDueDate,
        last_generated_at: new Date().toISOString(),
      }

      // 5. If end_date exists and new next_due_date > end_date, deactivate
      if (recurring.end_date && newNextDueDate > recurring.end_date) {
        updatePayload.is_active = false
      }

      const { error: updateError } = await supabase
        .from('recurring_tasks')
        .update(updatePayload)
        .eq('id', recurring.id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error(
          `Erreur mise à jour recurring ${recurring.id}:`,
          updateError
        )
        continue
      }

      generated++
    }

    revalidatePath('/dashboard/tasks')

    return { success: true as const, generated }
  } catch (error) {
    console.error('Erreur génération tâches récurrentes:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
