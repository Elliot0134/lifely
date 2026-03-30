'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { transactionSchema } from '@/lib/validations/transaction'

export async function createTransaction(formData: FormData) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validation des données
    const validated = transactionSchema.parse({
      description: formData.get('description'),
      amount: formData.get('amount'),
      type: formData.get('type'),
      category_id: formData.get('category_id'),
      account_id: formData.get('account_id'),
      date: formData.get('date'),
    })

    // Insérer en base
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        description: validated.description,
        amount: validated.amount,
        type: validated.type, // La colonne s'appelle 'type' dans transactions
        category_id: validated.category_id,
        account_id: validated.account_id,
        date: validated.date,
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
    revalidatePath('/dashboard/transactions')
    revalidatePath('/dashboard')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur création transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}