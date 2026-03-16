import { NextRequest, NextResponse } from 'next/server'
// Use same pattern as other routes - createRouteHandlerClient is used across API routes
// even though the export name is createClient in server.ts
import { createClient as createRouteHandlerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  transaction_type: z
    .enum(['revenue', 'variable_expense', 'fixed_expense', 'credit', 'savings'])
    .optional(),
  sort_order: z.number().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createRouteHandlerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    const { data: category, error } = await supabase
      .from('categories')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(
        `
        *,
        account:accounts(id, name, type)
      `
      )
      .single()

    if (error) {
      console.error('Erreur mise à jour catégorie:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Erreur API PATCH categories:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createRouteHandlerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check transaction count before deleting
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('user_id', user.id)

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: `Cette catégorie est utilisée par ${count} transaction(s). Supprimez ou réassignez-les d'abord.`,
          transaction_count: count,
        },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur suppression catégorie:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API DELETE categories:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
