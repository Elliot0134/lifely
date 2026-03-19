'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createCommentSchema } from '@/lib/validations/tasks'
import type { CreateCommentInput } from '@/types/tasks'

export async function getComments(taskId: string) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Récupérer les commentaires ordonnés par date de création ASC
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true as const, data: data ?? [] }
  } catch (error) {
    console.error('Erreur récupération commentaires:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function createComment(input: CreateCommentInput) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validation des données
    const validated = createCommentSchema.parse(input)

    // Insérer en base
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: validated.task_id,
        content: validated.content,
        author_type: validated.author_type,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Revalider les pages concernées
    revalidatePath('/dashboard/tasks')

    return { success: true as const, data }
  } catch (error) {
    console.error('Erreur création commentaire:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function updateComment(id: string, content: string) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validation minimale du contenu
    if (!content || content.trim().length === 0) {
      throw new Error('Le commentaire ne peut pas être vide')
    }
    if (content.length > 10000) {
      throw new Error('Le commentaire est trop long (max 10000 caractères)')
    }

    // Mettre à jour en base
    const { data, error } = await supabase
      .from('task_comments')
      .update({ content: content.trim() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Revalider les pages concernées
    revalidatePath('/dashboard/tasks')

    return { success: true as const, data }
  } catch (error) {
    console.error('Erreur mise à jour commentaire:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function deleteComment(id: string) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Check if comment is a Claude comment — users cannot delete those
    const { data: comment, error: fetchError } = await supabase
      .from('task_comments')
      .select('author_type')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !comment) {
      throw new Error('Commentaire introuvable')
    }

    if (comment.author_type === 'claude') {
      throw new Error('Les commentaires de Claude ne peuvent pas être supprimés')
    }

    // Supprimer en base (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    // Revalider les pages concernées
    revalidatePath('/dashboard/tasks')

    return { success: true as const }
  } catch (error) {
    console.error('Erreur suppression commentaire:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
