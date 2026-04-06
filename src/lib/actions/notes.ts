'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createNoteSchema, updateNoteSchema } from '@/lib/validations/notes'
import type { CreateNoteInput, UpdateNoteInput } from '@/types/tasks'

interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createNote(
  input: CreateNoteInput
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

    const validated = createNoteSchema.parse(input)
    const { tag_ids, ...noteFields } = validated

    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...noteFields,
        content: noteFields.content ?? {},
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    if (tag_ids && tag_ids.length > 0) {
      const tagRows = tag_ids.map((tag_id) => ({
        note_id: data.id,
        tag_id,
      }))

      const { error: tagError } = await supabase
        .from('note_tags')
        .insert(tagRows)

      if (tagError) {
        throw new Error(tagError.message)
      }
    }

    revalidatePath('/notes')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur création note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function updateNote(
  input: UpdateNoteInput
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

    const validated = updateNoteSchema.parse(input)
    const { id, tag_ids, ...updateFields } = validated

    let data = null
    if (Object.keys(updateFields).length > 0) {
      const { data: updatedNote, error } = await supabase
        .from('notes')
        .update(updateFields)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }
      data = updatedNote
    } else {
      const { data: existingNote, error } = await supabase
        .from('notes')
        .select()
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        throw new Error(error.message)
      }
      data = existingNote
    }

    if (tag_ids !== undefined) {
      const { error: deleteError } = await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      if (tag_ids.length > 0) {
        const tagRows = tag_ids.map((tag_id) => ({
          note_id: id,
          tag_id,
        }))

        const { error: tagError } = await supabase
          .from('note_tags')
          .insert(tagRows)

        if (tagError) {
          throw new Error(tagError.message)
        }
      }
    }

    revalidatePath('/notes')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur mise à jour note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function deleteNote(id: string): Promise<ActionResponse<null>> {
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

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/notes')

    return { success: true, data: null }
  } catch (error) {
    console.error('Erreur suppression note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function toggleNotePin(id: string, is_pinned: boolean): Promise<ActionResponse> {
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
      .from('notes')
      .update({ is_pinned })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/notes')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur toggle pin note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
