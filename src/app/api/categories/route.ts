import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { Database } from '@/types/database.types'

// Schema de validation pour créer une catégorie
const createCategorySchema = z.object({
  account_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  icon: z.string().optional(),
  color: z.string().optional(),
  transaction_type: z.enum(['revenue', 'variable_expense', 'fixed_expense', 'credit', 'savings']),
  sort_order: z.number().optional(),
})

type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryRow = Database['public']['Tables']['categories']['Row']

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const transactionType = searchParams.get('transaction_type')
    const accountId = searchParams.get('account_id')

    // Construire la requête avec le count des transactions
    let query = supabase
      .from('categories')
      .select(`
        *,
        account:accounts(id, name, type),
        transactions(count)
      `)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    // Appliquer les filtres
    if (transactionType) {
      query = query.eq('transaction_type', transactionType)
    }
    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des catégories:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Grouper par type de transaction
    const groupedCategories = categories.reduce((acc, category) => {
      const type = category.transaction_type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(category)
      return acc
    }, {} as Record<string, typeof categories>)

    return NextResponse.json({
      data: categories,
      grouped: groupedCategories,
    })
  } catch (error) {
    console.error('Erreur API categories:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Valider les données
    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    // Vérifier que le compte appartient à l'utilisateur
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', validatedData.account_id)
      .eq('user_id', user.id)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 })
    }

    // Créer la catégorie
    const categoryData: CategoryInsert = {
      ...validatedData,
      user_id: user.id,
      icon: validatedData.icon || '📁',
      color: validatedData.color || '#6B7280',
      sort_order: validatedData.sort_order || 0,
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select(`
        *,
        account:accounts(id, name, type)
      `)
      .single()

    if (error) {
      console.error('Erreur lors de la création de la catégorie:', error)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Données invalides',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Erreur API POST categories:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}