import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { Database } from '@/types/database.types'

// Schema de validation pour créer un budget
const createBudgetSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid(),
  amount: z.number().min(0),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
})

type BudgetInsert = Database['public']['Tables']['budgets']['Insert']
type BudgetRow = Database['public']['Tables']['budgets']['Row']

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString())
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const accountId = searchParams.get('account_id')

    // Utiliser la vue budget_vs_real pour avoir les données complètes
    let query = supabase
      .from('v_budget_vs_real')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)
      .order('category_name')

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { data: budgetsVsReal, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des budgets:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Récupérer aussi les budgets bruts pour l'édition
    let budgetsQuery = supabase
      .from('budgets')
      .select(`
        *,
        category:categories(id, name, icon, color, transaction_type),
        account:accounts(id, name, type)
      `)
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)

    if (accountId) {
      budgetsQuery = budgetsQuery.eq('account_id', accountId)
    }

    const { data: budgets, error: budgetsError } = await budgetsQuery

    if (budgetsError) {
      console.error('Erreur lors de la récupération des budgets bruts:', budgetsError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        budgets_vs_real: budgetsVsReal,
        budgets: budgets,
        period: { month, year }
      }
    })
  } catch (error) {
    console.error('Erreur API budgets:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Valider les données
    const body = await request.json()
    const validatedData = createBudgetSchema.parse(body)

    // Vérifier que le compte et la catégorie appartiennent à l'utilisateur
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', validatedData.account_id)
      .eq('user_id', user.id)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 })
    }

    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('id', validatedData.category_id)
      .eq('user_id', user.id)
      .single()

    if (!category) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 })
    }

    // Vérifier s'il existe déjà un budget pour cette période/catégorie
    const { data: existingBudget } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', user.id)
      .eq('account_id', validatedData.account_id)
      .eq('category_id', validatedData.category_id)
      .eq('month', validatedData.month)
      .eq('year', validatedData.year)
      .single()

    if (existingBudget) {
      return NextResponse.json({
        error: 'Un budget existe déjà pour cette catégorie et cette période'
      }, { status: 409 })
    }

    // Créer le budget
    const budgetData: BudgetInsert = {
      ...validatedData,
      user_id: user.id,
    }

    const { data: budget, error } = await supabase
      .from('budgets')
      .insert(budgetData)
      .select(`
        *,
        category:categories(id, name, icon, color, transaction_type),
        account:accounts(id, name, type)
      `)
      .single()

    if (error) {
      console.error('Erreur lors de la création du budget:', error)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ data: budget }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Données invalides',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Erreur API POST budgets:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}