'use server'

import { createClient } from '@/lib/supabase/server'
import { DEFAULT_CATEGORIES } from '@/lib/constants'

/**
 * Initialise les catégories par défaut pour un utilisateur
 */
export async function initDefaultCategories(userId?: string) {
  try {
    const supabase = await createClient()

    // Récupérer l'utilisateur actuel si aucun userId fourni
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Non autorisé')
      }
      currentUserId = user.id
    }

    // Récupérer le compte par défaut de l'utilisateur
    const { data: defaultAccount, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('is_default', true)
      .single()

    if (accountError || !defaultAccount) {
      throw new Error('Aucun compte par défaut trouvé')
    }

    // Vérifier si l'utilisateur a déjà des catégories
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', currentUserId)
      .limit(1)

    if (existingCategories && existingCategories.length > 0) {
      console.log('L\'utilisateur a déjà des catégories, initialisation ignorée')
      return { success: true, message: 'Catégories déjà existantes' }
    }

    // Préparer les données des catégories par défaut
    const categoriesToInsert = DEFAULT_CATEGORIES.map(category => ({
      name: category.name,
      icon: category.icon,
      color: category.color,
      transaction_type: category.transaction_type,
      account_id: defaultAccount.id,
      user_id: currentUserId,
      is_default: true,
      sort_order: 0,
    }))

    // Insérer toutes les catégories par défaut
    const { data, error } = await supabase
      .from('categories')
      .insert(categoriesToInsert)
      .select('id, name')

    if (error) {
      throw new Error(`Erreur lors de l'insertion des catégories : ${error.message}`)
    }

    console.log(`${data.length} catégories par défaut créées pour l'utilisateur ${currentUserId}`)

    return {
      success: true,
      data: data,
      message: `${data.length} catégories par défaut créées avec succès`
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des catégories par défaut:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Force l'initialisation des catégories par défaut même si l'utilisateur en a déjà
 */
export async function forceInitDefaultCategories() {
  try {
    const supabase = await createClient()

    // Récupérer l'utilisateur actuel
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Récupérer le compte par défaut de l'utilisateur
    const { data: defaultAccount, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (accountError || !defaultAccount) {
      throw new Error('Aucun compte par défaut trouvé')
    }

    // Préparer les données des catégories par défaut
    const categoriesToInsert = DEFAULT_CATEGORIES.map(category => ({
      name: category.name,
      icon: category.icon,
      color: category.color,
      transaction_type: category.transaction_type,
      account_id: defaultAccount.id,
      user_id: user.id,
      is_default: true,
      sort_order: 0,
    }))

    // Insérer toutes les catégories par défaut (ignorer les doublons)
    const { data, error } = await supabase
      .from('categories')
      .upsert(categoriesToInsert, {
        onConflict: 'user_id,account_id,name',
        ignoreDuplicates: true
      })
      .select('id, name')

    if (error) {
      throw new Error(`Erreur lors de l'insertion des catégories : ${error.message}`)
    }

    console.log(`Catégories par défaut synchronisées pour l'utilisateur ${user.id}`)

    return {
      success: true,
      data: data,
      message: `Catégories par défaut synchronisées avec succès`
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des catégories par défaut:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}