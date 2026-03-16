'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createTaskSchema, updateTaskSchema } from '@/lib/validations/tasks'
import type { CreateTaskInput, UpdateTaskInput, Task } from '@/types/tasks'

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

    // Insert task
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskFields,
        user_id: user.id,
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

    revalidatePath('/dashboard/tasks')

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

    // Update task fields (only if there are fields to update)
    let data: Task | null = null
    if (Object.keys(updateFields).length > 0) {
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update(updateFields)
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

    revalidatePath('/dashboard/tasks')

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

    revalidatePath('/dashboard/tasks')

    return { success: true, data: null }
  } catch (error) {
    console.error('Erreur suppression task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function toggleTask(id: string): Promise<ActionResponse> {
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

    // Fetch current state
    const { data: current, error: fetchError } = await supabase
      .from('tasks')
      .select('is_completed')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    // Toggle is_completed
    const newCompleted = !current.is_completed
    const { data, error } = await supabase
      .from('tasks')
      .update({
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/tasks')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur toggle task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
