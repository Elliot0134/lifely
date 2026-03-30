import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface DashboardStats {
  revenue: number
  variable_expense: number
  fixed_expense: number
  credit: number
  savings: number
  net_income: number
  previous_month_revenue: number
  previous_month_expenses: number
  revenue_growth: number
  expense_growth: number
}

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

    // Calculer le mois précédent
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    // Récupérer les statistiques du mois actuel via la vue v_monthly_summary
    let currentQuery = supabase
      .from('v_monthly_summary')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)

    if (accountId) {
      currentQuery = currentQuery.eq('account_id', accountId)
    }

    const { data: currentStats, error: currentError } = await currentQuery

    if (currentError) {
      console.error('Erreur lors de la récupération des stats actuelles:', currentError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Récupérer les statistiques du mois précédent
    let previousQuery = supabase
      .from('v_monthly_summary')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', prevMonth)
      .eq('year', prevYear)

    if (accountId) {
      previousQuery = previousQuery.eq('account_id', accountId)
    }

    const { data: previousStats, error: previousError } = await previousQuery

    if (previousError) {
      console.error('Erreur lors de la récupération des stats précédentes:', previousError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Traiter les données pour créer les KPIs
    const processStats = (stats: typeof currentStats) => {
      return stats.reduce((acc, stat) => {
        acc[stat.transaction_type as keyof DashboardStats] = (acc[stat.transaction_type as keyof DashboardStats] || 0) + (stat.total || 0)
        return acc
      }, {
        revenue: 0,
        variable_expense: 0,
        fixed_expense: 0,
        credit: 0,
        savings: 0,
      } as Partial<DashboardStats>)
    }

    const current = processStats(currentStats)
    const previous = processStats(previousStats)

    // Calculer les métriques dérivées
    const totalExpenses = (current.variable_expense || 0) + (current.fixed_expense || 0)
    const previousTotalExpenses = (previous.variable_expense || 0) + (previous.fixed_expense || 0)

    const netIncome = (current.revenue || 0) - totalExpenses
    const revenueGrowth = previous.revenue
      ? ((current.revenue || 0) - (previous.revenue || 0)) / (previous.revenue || 0) * 100
      : 0
    const expenseGrowth = previousTotalExpenses
      ? (totalExpenses - previousTotalExpenses) / previousTotalExpenses * 100
      : 0

    // Récupérer les données pour les graphiques (breakdown par catégorie)
    let categoryQuery = supabase
      .from('v_category_breakdown')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)
      .order('total', { ascending: false })

    if (accountId) {
      categoryQuery = categoryQuery.eq('account_id', accountId)
    }

    const { data: categoryBreakdown, error: categoryError } = await categoryQuery

    if (categoryError) {
      console.error('Erreur lors de la récupération du breakdown:', categoryError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Structurer la réponse
    const dashboardData = {
      kpis: {
        revenue: current.revenue || 0,
        expenses: totalExpenses,
        savings: current.savings || 0,
        credit: current.credit || 0,
        net_income: netIncome,
        revenue_growth: revenueGrowth,
        expense_growth: expenseGrowth,
      },
      breakdown_by_type: {
        revenue: current.revenue || 0,
        variable_expense: current.variable_expense || 0,
        fixed_expense: current.fixed_expense || 0,
        credit: current.credit || 0,
        savings: current.savings || 0,
      },
      category_breakdown: categoryBreakdown,
      period: { month, year },
      comparison_period: { month: prevMonth, year: prevYear },
    }

    return NextResponse.json({ data: dashboardData })
  } catch (error) {
    console.error('Erreur API dashboard stats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}