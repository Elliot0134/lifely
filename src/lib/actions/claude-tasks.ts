'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
