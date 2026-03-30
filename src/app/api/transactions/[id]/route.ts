import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { Database } from '@/types/database.types'

// Schema de validation pour modifier une transaction
const updateTransactionSchema = z.object({
  account_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  type: z.enum(['revenue', 'variable_expense', 'fixed_expense', 'credit', 'savings']).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurring_id: z.string().uuid().optional(),
})

type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(id, name, icon, color, transaction_type),
        account:accounts(id, name, type)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })
      }
      console.error('Erreur lors de la récupération de la transaction:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ data: transaction })
  } catch (error) {
    console.error('Erreur API GET transaction:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Valider les données
    const body = await request.json()
    const validatedData = updateTransactionSchema.parse(body)

    // Vérifier que la transaction appartient à l'utilisateur
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })
    }

    // Mettre à jour la transaction
    const updateData: TransactionUpdate = {
      account_id: validatedData.account_id,
      category_id: validatedData.category_id,
      type: validatedData.type,
      amount: validatedData.amount,
      description: validatedData.description,
      date: validatedData.date,
      is_recurring: validatedData.is_recurring,
      recurring_id: validatedData.recurring_id,
      updated_at: new Date().toISOString(),
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        category:categories(id, name, icon, color, transaction_type),
        account:accounts(id, name, type)
      `)
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour de la transaction:', error)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ data: transaction })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Données invalides',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Erreur API PATCH transaction:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que la transaction appartient à l'utilisateur
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })
    }

    // Supprimer la transaction
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur lors de la suppression de la transaction:', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Transaction supprimée avec succès' })
  } catch (error) {
    console.error('Erreur API DELETE transaction:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}