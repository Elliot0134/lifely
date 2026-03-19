'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createTaskSchema, updateTaskSchema } from '@/lib/validations/tasks'
import type { CreateTaskInput, UpdateTaskInput, Task, TaskStatus } from '@/types/tasks'

interface ActionResponse<T = Task> {
  success: boolean
  data?: T
  error?: string
}

export async function createTask(
  input: CreateTaskInput
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
    const validated = createTaskSchema.parse(input)

    // Separate tag_ids from task fields
    const { tag_ids, ...taskFields } = validated

    // Insert task with status:'todo' by default
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskFields,
        user_id: user.id,
        status: 'todo' as const,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Insert tag associations if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagRows = tag_ids.map((tag_id) => ({
        task_id: data.id,
        tag_id,
      }))

      const { error: tagError } = await supabase
        .from('task_tags')
        .insert(tagRows)

      if (tagError) {
        throw new Error(tagError.message)
      }
    }

    revalidatePath('/tasks')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur création task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function updateTask(
  input: UpdateTaskInput
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
    const validated = updateTaskSchema.parse(input)
    const { id, tag_ids, ...updateFields } = validated

    // Set completed_at when status changes to 'completed'
    const fieldsToUpdate: Record<string, unknown> = { ...updateFields }
    if (updateFields.status === 'completed') {
      fieldsToUpdate.completed_at = new Date().toISOString()
    } else if (updateFields.status) {
      fieldsToUpdate.completed_at = null
    }

    // Update task fields (only if there are fields to update)
    let data: Task | null = null
    if (Object.keys(fieldsToUpdate).length > 0) {
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update(fieldsToUpdate)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }
      data = updatedTask
    } else {
      // Just fetch the task if no fields to update (tag-only update)
      const { data: existingTask, error } = await supabase
        .from('tasks')
        .select()
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        throw new Error(error.message)
      }
      data = existingTask
    }

    // Sync tag associations if provided
    if (tag_ids !== undefined) {
      // Delete existing tag associations
      const { error: deleteError } = await supabase
        .from('task_tags')
        .delete()
        .eq('task_id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Insert new tag associations
      if (tag_ids.length > 0) {
        const tagRows = tag_ids.map((tag_id) => ({
          task_id: id,
          tag_id,
        }))

        const { error: tagError } = await supabase
          .from('task_tags')
          .insert(tagRows)

        if (tagError) {
          throw new Error(tagError.message)
        }
      }
    }

    revalidatePath('/tasks')

    return { success: true, data: data ?? undefined }
  } catch (error) {
    console.error('Erreur mise à jour task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function deleteTask(id: string): Promise<ActionResponse<null>> {
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

    // Validate id
    if (!id || typeof id !== 'string') {
      throw new Error('ID invalide')
    }

    // Delete task (cascade handles task_tags and subtasks)
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/tasks')

    return { success: true, data: null }
  } catch (error) {
    console.error('Erreur suppression task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus
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

    // Validate id
    if (!id || typeof id !== 'string') {
      throw new Error('ID invalide')
    }

    // Validate status
    const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'completed']
    if (!validStatuses.includes(status)) {
      throw new Error('Statut invalide')
    }

    // Update status and completed_at
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/tasks')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur update task status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

// ─── Bulk & Schedule Actions ─────────────────────────────────

const reorderTasksSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sort_order: z.number().int(),
  })
)

export async function reorderTasks(
  items: { id: string; sort_order: number }[]
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const validated = reorderTasksSchema.parse(items)

    // Update each task's sort_order
    for (const item of validated) {
      const { error } = await supabase
        .from('tasks')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('user_id', user.id)

      if (error) {
        throw new Error(error.message)
      }
    }

    revalidatePath('/tasks')

    return { success: true, data: null }
  } catch (error) {
    console.error('Erreur reorder tasks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

const bulkCreateTasksSchema = z.array(createTaskSchema)

export async function bulkCreateTasks(
  inputs: CreateTaskInput[]
): Promise<ActionResponse<Task[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const validated = bulkCreateTasksSchema.parse(inputs)

    // Separate tag_ids from task fields for each input
    const taskRows = validated.map(({ tag_ids: _tag_ids, ...taskFields }) => ({
      ...taskFields,
      user_id: user.id,
      status: 'todo' as const,
    }))

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskRows)
      .select()

    if (error) {
      throw new Error(error.message)
    }

    // Insert tag associations for each task that has tag_ids
    for (let i = 0; i < validated.length; i++) {
      const { tag_ids } = validated[i]
      if (tag_ids && tag_ids.length > 0 && data[i]) {
        const tagRows = tag_ids.map((tag_id) => ({
          task_id: data[i].id,
          tag_id,
        }))

        const { error: tagError } = await supabase
          .from('task_tags')
          .insert(tagRows)

        if (tagError) {
          throw new Error(tagError.message)
        }
      }
    }

    revalidatePath('/tasks')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur bulk create tasks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

const bulkIdsSchema = z.array(z.string().uuid()).min(1)

export async function bulkDeleteTasks(
  ids: string[]
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const validated = bulkIdsSchema.parse(ids)

    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', validated)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/tasks')

    return { success: true, data: null }
  } catch (error) {
    console.error('Erreur bulk delete tasks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

const bulkUpdateStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.enum(['todo', 'in_progress', 'completed']),
})

export async function bulkUpdateStatus(
  ids: string[],
  status: TaskStatus
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const validated = bulkUpdateStatusSchema.parse({ ids, status })

    const { error } = await supabase
      .from('tasks')
      .update({
        status: validated.status,
        completed_at: validated.status === 'completed'
          ? new Date().toISOString()
          : null,
      })
      .in('id', validated.ids)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/tasks')

    return { success: true, data: null }
  } catch (error) {
    console.error('Erreur bulk update status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const scheduleTaskSchema = z.object({
  id: z.string().uuid(),
  scheduled_date: z.string().min(1, 'La date est obligatoire'),
  scheduled_start_time: z.string().regex(timeRegex, 'Format HH:MM attendu'),
  scheduled_end_time: z.string().regex(timeRegex, 'Format HH:MM attendu'),
})

export async function scheduleTask(input: {
  id: string
  scheduled_date: string
  scheduled_start_time: string
  scheduled_end_time: string
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const validated = scheduleTaskSchema.parse(input)

    const { data, error } = await supabase
      .from('tasks')
      .update({
        scheduled_date: validated.scheduled_date,
        scheduled_start_time: validated.scheduled_start_time,
        scheduled_end_time: validated.scheduled_end_time,
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/tasks')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur schedule task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function unscheduleTask(
  id: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

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

    const { data, error } = await supabase
      .from('tasks')
      .update({
        scheduled_date: null,
        scheduled_start_time: null,
        scheduled_end_time: null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/tasks')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur unschedule task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
