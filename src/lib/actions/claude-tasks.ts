'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TaskStatus } from '@/types/tasks'

/**
 * Add a comment authored by Claude on a task.
 * Sets author_type to 'claude' so the UI can differentiate it from user comments.
 */
export async function addClaudeComment(taskId: string, content: string) {
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

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error('Le commentaire ne peut pas être vide')
    }
    if (content.length > 10000) {
      throw new Error('Le commentaire est trop long (max 10000 caractères)')
    }

    // Insert Claude comment
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        content: content.trim(),
        author_type: 'claude',
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
    console.error('Erreur ajout commentaire Claude:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Get all code tasks that need work.
 * Returns tasks where is_code_task=true and status is not 'completed'.
 * Each task includes: ai_instructions, project_name, tags, body, status.
 * @returns Array of code tasks with full context
 */
export async function getCodeTasks() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const { data, error } = await supabase
      .from('task_details')
      .select('*')
      .eq('is_code_task', true)
      .neq('status', 'completed')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true as const, data: data ?? [] }
  } catch (error) {
    console.error('Erreur récupération code tasks:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Get full context for a specific task.
 * Returns the task with all details for Claude to work on.
 * @param taskId - The UUID of the task
 * @returns Task with full details including ai_instructions, project, tags, body
 */
export async function getTaskContext(taskId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    if (!taskId) {
      throw new Error('taskId est requis')
    }

    const { data, error } = await supabase
      .from('task_details')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true as const, data }
  } catch (error) {
    console.error('Erreur récupération contexte task:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Update a task's status.
 * Used by Claude to mark tasks as in_progress or completed.
 * @param taskId - The UUID of the task
 * @param status - New status: 'todo' | 'in_progress' | 'completed'
 */
export async function updateTaskStatusForClaude(taskId: string, status: TaskStatus) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    if (!taskId) {
      throw new Error('taskId est requis')
    }

    const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'completed']
    if (!validStatuses.includes(status)) {
      throw new Error(`Statut invalide: ${status}`)
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/tasks')

    return { success: true as const, data }
  } catch (error) {
    console.error('Erreur mise à jour statut task:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
