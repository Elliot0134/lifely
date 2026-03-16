'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createProjectSchema,
  updateProjectSchema,
} from '@/lib/validations/tasks'
import type { CreateProjectInput, UpdateProjectInput, Project } from '@/types/tasks'

type ActionResponse<T = Project> = {
  success: boolean
  data?: T
  error?: string
}

export async function createProject(
  input: CreateProjectInput
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validate input
    const validated = createProjectSchema.parse(input)

    // Insert project
    const { data, error } = await supabase
      .from('task_projects')
      .insert({
        name: validated.name,
        description: validated.description ?? null,
        company_id: validated.company_id ?? null,
        color: validated.color ?? null,
        start_date: validated.start_date ?? null,
        end_date: validated.end_date ?? null,
        user_id: user.id,
        status: 'not_started',
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/tasks')

    return { success: true, data: data as Project }
  } catch (error) {
    console.error('Erreur création projet:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function updateProject(
  input: UpdateProjectInput
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validate input
    const validated = updateProjectSchema.parse(input)
    const { id, ...updateFields } = validated

    // Update project (RLS ensures user can only update their own)
    const { data, error } = await supabase
      .from('task_projects')
      .update(updateFields)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/tasks')

    return { success: true, data: data as Project }
  } catch (error) {
    console.error('Erreur mise à jour projet:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function deleteProject(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validate id
    if (!id || typeof id !== 'string') {
      throw new Error('ID de projet invalide')
    }

    // Delete project (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('task_projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/tasks')

    return { success: true, data: { id } }
  } catch (error) {
    console.error('Erreur suppression projet:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
