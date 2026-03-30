'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { budgetSchema } from '@/lib/validations/budget'

export async function createBudget(formData: FormData) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validation des données
    const validated = budgetSchema.parse({
      category_id: formData.get('category_id'),
      account_id: formData.get('account_id'),
      amount: formData.get('amount'),
      period_start: formData.get('period_start'),
      period_end: formData.get('period_end'),
    })

    // Transformer les dates en month/year pour la base de données
    const startDate = new Date(validated.period_start)
    const month = startDate.getMonth() + 1 // JS months are 0-based
    const year = startDate.getFullYear()

    // Vérifier qu'il n'y a pas déjà un budget pour cette catégorie/compte sur cette période
    const { data: existingBudget } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', user.id)
      .eq('category_id', validated.category_id)
      .eq('account_id', validated.account_id)
      .eq('month', month)
      .eq('year', year)
      .single()

    if (existingBudget) {
      throw new Error('Un budget existe déjà pour cette catégorie sur cette période')
    }

    // Insérer en base
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        category_id: validated.category_id,
        account_id: validated.account_id,
        amount: validated.amount,
        month: month,
        year: year,
        user_id: user.id,
      })
      .select(`
        *,
        category:categories(*),
        account:accounts(*)
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Revalider les pages concernées
    revalidatePath('/dashboard/budgets')
    revalidatePath('/dashboard')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur création budget:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}