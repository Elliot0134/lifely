'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createCompanySchema,
  updateCompanySchema,
} from '@/lib/validations/tasks'
import type { CreateCompanyInput, UpdateCompanyInput } from '@/types/tasks'

export async function createCompany(input: CreateCompanyInput) {
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
    const validated = createCompanySchema.parse(input)

    // Insérer en base
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: validated.name,
        color: validated.color ?? null,
        icon: validated.icon ?? null,
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
    console.error('Erreur création company:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function updateCompany(input: UpdateCompanyInput) {
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
    const validated = updateCompanySchema.parse(input)
    const { id, ...updates } = validated

    // Guard: prevent changing is_personal flag
    if ('is_personal' in updates) {
      delete (updates as Record<string, unknown>).is_personal
    }

    // Mettre à jour en base
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
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
    console.error('Erreur mise à jour company:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function deleteCompany(id: string) {
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

    // Guard: personal company cannot be deleted
    const { data: company } = await supabase
      .from('companies')
      .select('is_personal')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (company?.is_personal) {
      throw new Error('L\'entreprise personnelle ne peut pas être supprimée')
    }

    // Supprimer en base (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('companies')
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
    console.error('Erreur suppression company:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function createPersonalCompany(userId: string) {
  try {
    const supabase = await createClient()

    // Check if personal company already exists
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', userId)
      .eq('is_personal', true)
      .maybeSingle()

    if (existing) {
      return { success: true as const, data: existing }
    }

    // Create personal company
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: 'Personnel',
        is_personal: true,
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/tasks')

    return { success: true as const, data }
  } catch (error) {
    console.error('Erreur création personal company:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
