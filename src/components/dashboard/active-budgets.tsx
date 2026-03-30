'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface BudgetRow {
  category_id: string | null
  category_name: string | null
  category_icon: string | null
  category_color: string | null
  budget_amount: number | null
  real_amount: number | null
  percentage_used: number | null
}

function BudgetsSkeleton() {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-4">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function getBudgetBarColor(percentage: number): string {
  if (percentage < 80) return '#8b9a6b'   // Green
  if (percentage <= 100) return '#d4a76a'   // Orange
  return '#c45c5c'                            // Red
}

export function ActiveBudgets() {
  const [budgets, setBudgets] = useState<BudgetRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBudgets() {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        const { data, error: fetchError } = await supabase
          .from('v_budget_vs_real')
          .select('category_id, category_name, category_icon, category_color, budget_amount, real_amount, percentage_used')
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .order('percentage_used', { ascending: false })

        if (fetchError) throw fetchError

        setBudgets((data as BudgetRow[]) || [])
      } catch (err) {
        console.error('Error fetching budgets:', err)
        setError('Erreur lors du chargement des budgets')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBudgets()
  }, [])

  if (isLoading) return <BudgetsSkeleton />

  if (error) {
    return (
      <Card className="bg-card">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Budgets actifs</CardTitle>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            Aucun budget defini pour ce mois
          </p>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const percentage = budget.percentage_used ?? 0
              const clampedPercentage = Math.min(percentage, 100)
              const barColor = getBudgetBarColor(percentage)
              const icon = budget.category_icon || '📊'
              const spent = budget.real_amount ?? 0
              const total = budget.budget_amount ?? 0

              return (
                <div key={budget.category_id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{icon}</span>
                      <span className="text-sm font-medium">{budget.category_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(spent)} / {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${clampedPercentage}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                  {percentage > 100 && (
                    <p className="text-xs font-medium" style={{ color: barColor }}>
                      Depasse de {Math.round(percentage - 100)}%
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
