import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { Database } from '@/types/database.types'

// Schema de validation pour créer un compte
const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['personal', 'business']),
  is_default: z.boolean().optional(),
})

type AccountInsert = Database['public']['Tables']['accounts']['Insert']
type AccountRow = Database['public']['Tables']['accounts']['Row']

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des comptes:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ data: accounts })
  } catch (error) {
    console.error('Erreur API accounts:', error)
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
    const validatedData = createAccountSchema.parse(body)

    // Si c'est le compte par défaut, retirer le statut par défaut des autres
    if (validatedData.is_default) {
      await supabase
        .from('accounts')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    // Créer le compte
    const accountData: AccountInsert = {
      ...validatedData,
      user_id: user.id,
    }

    const { data: account, error } = await supabase
      .from('accounts')
      .insert(accountData)
      .select('*')
      .single()

    if (error) {
      console.error('Erreur lors de la création du compte:', error)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ data: account }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Données invalides',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Erreur API POST accounts:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}