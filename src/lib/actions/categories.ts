'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { categorySchema } from '@/lib/validations/category'

export async function createCategory(formData: FormData) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Validation des données
    const validated = categorySchema.parse({
      name: formData.get('name'),
      icon: formData.get('icon'),
      color: formData.get('color'),
      type: formData.get('type'),
    })

    // Récupérer le compte par défaut de l'utilisateur
    const { data: defaultAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (!defaultAccount) {
      throw new Error('Aucun compte par défaut trouvé')
    }

    // Insérer en base (transformer type -> transaction_type)
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: validated.name,
        icon: validated.icon,
        color: validated.color,
        transaction_type: validated.type, // Transformation ici
        account_id: defaultAccount.id, // Account par défaut
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Revalider les pages concernées
    revalidatePath('/dashboard/categories')
    revalidatePath('/dashboard/transactions')
    revalidatePath('/dashboard')

    return { success: true, data }
  } catch (error) {
    console.error('Erreur création catégorie:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}