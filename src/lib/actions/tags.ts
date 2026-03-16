'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createTagSchema, updateTagSchema } from '@/lib/validations/tasks'
import type { Tag } from '@/types/tasks'

interface ActionResponse<T = Tag> {
  success: boolean
  data?: T
  error?: string
}

export async function createTag(
  input: { name: string; color?: string }
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validate input
    const validated = createTagSchema.parse(input)

    // Insert tag
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: validated.name,
        color: validated.color,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/tasks')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur création tag:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function updateTag(
  input: { id: string; name?: string; color?: string }
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validate input
    const validated = updateTagSchema.parse(input)
    const { id, ...updateData } = validated

    // Update tag (RLS ensures user can only update their own)
    const { data, error } = await supabase
      .from('tags')
      .update(updateData)
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
    console.error('Erreur mise à jour tag:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function deleteTag(id: string): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validate id
    if (!id || typeof id !== 'string') {
      throw new Error('ID invalide')
    }

    // Delete tag (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/tasks')

    return { success: true, data: null }
  } catch (error) {
    console.error('Erreur suppression tag:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
