import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { Database } from '@/types/database.types'

// Schema de validation pour créer une transaction
const createTransactionSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid(),
  type: z.enum(['revenue', 'variable_expense', 'fixed_expense', 'credit', 'savings']),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string().optional(), // Format YYYY-MM-DD
  is_recurring: z.boolean().default(false),
  recurring_id: z.string().uuid().optional(),
})

type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionRow = Database['public']['Tables']['transactions']['Row']

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
    const type = searchParams.get('type')
    const categoryId = searchParams.get('category_id')
    const accountId = searchParams.get('account_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Construire la requête
    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories(id, name, icon, color, transaction_type),
        account:accounts(id, name, type)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    // Appliquer les filtres
    if (type) {
      query = query.eq('type', type)
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    if (accountId) {
      query = query.eq('account_id', accountId)
    }
    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('date', dateTo)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: transactions, error, count } = await query

    if (error) {
      console.error('Erreur lors de la récupération des transactions:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Métadonnées de pagination
    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext,
        hasPrev,
      },
    })
  } catch (error) {
    console.error('Erreur API transactions:', error)
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
    const validatedData = createTransactionSchema.parse(body)

    // Créer la transaction
    const transactionData: TransactionInsert = {
      ...validatedData,
      user_id: user.id,
      date: validatedData.date || new Date().toISOString().split('T')[0],
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select(`
        *,
        category:categories(id, name, icon, color, transaction_type),
        account:accounts(id, name, type)
      `)
      .single()

    if (error) {
      console.error('Erreur lors de la création de la transaction:', error)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ data: transaction }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Données invalides',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Erreur API POST transactions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}