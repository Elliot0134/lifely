'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import {
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Wallet,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/lib/utils'
import { MONTHS } from '@/lib/constants'
import { BudgetModal } from './budget-modal'

// Types matching the v_budget_vs_real view
interface BudgetVsReal {
  account_id: string | null
  account_name: string | null
  budget_amount: number | null
  category_color: string | null
  category_icon: string | null
  category_id: string | null
  category_name: string | null
  month: number | null
  percentage_used: number | null
  real_amount: number | null
  remaining: number | null
  transaction_type: string | null
  user_id: string | null
  year: number | null
}

type StatusFilter = 'all' | 'active' | 'completed' | 'exceeded'

function getProgressColor(percentage: number): string {
  if (percentage < 80) return 'bg-green-500'
  if (percentage <= 100) return 'bg-orange-500'
  return 'bg-red-500'
}

function getStatusBadge(percentage: number) {
  if (percentage > 100) {
    return (
      <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
        DEPASSE
      </span>
    )
  }
  if (percentage >= 80) {
    return (
      <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
        ATTENTION
      </span>
    )
  }
  return null
}

export function BudgetGrid() {
  const [budgets, setBudgets] = useState<BudgetVsReal[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const supabase = useMemo(() => createClient(), [])

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('v_budget_vs_real')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .order('category_name')

      if (error) {
        console.error('Error fetching budgets:', error)
        toast.error('Erreur lors du chargement des budgets')
        return
      }

      setBudgets(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors du chargement des budgets')
    } finally {
      setLoading(false)
    }
  }, [supabase, month, year])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const handleDelete = async (categoryId: string) => {
    if (!categoryId) return

    setDeleting(categoryId)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .eq('month', month)
        .eq('year', year)

      if (error) {
        toast.error('Erreur lors de la suppression')
        return
      }

      toast.success('Budget supprime avec succes')
      fetchBudgets()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  // Filter budgets by status
  const filteredBudgets = useMemo(() => {
    if (statusFilter === 'all') return budgets

    return budgets.filter((b) => {
      const pct = b.percentage_used ?? 0
      switch (statusFilter) {
        case 'active':
          return pct < 80
        case 'completed':
          return pct >= 80 && pct <= 100
        case 'exceeded':
          return pct > 100
        default:
          return true
      }
    })
  }, [budgets, statusFilter])

  // Year options
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={month.toString()}
          onValueChange={(v) => setMonth(parseInt(v))}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Mois" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={(i + 1).toString()}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={year.toString()}
          onValueChange={(v) => setYear(parseInt(v))}
        >
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="Annee" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">En cours</SelectItem>
            <SelectItem value="completed">Termine</SelectItem>
            <SelectItem value="exceeded">Depasse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {budgets.length === 0 ? (
        <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Wallet className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Aucun budget</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Commencez par creer un budget pour suivre vos depenses par
              categorie sur {MONTHS[month - 1]} {year}.
            </p>
            <BudgetModal
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Creer un budget
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : filteredBudgets.length === 0 ? (
        <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              Aucun budget ne correspond au filtre selectionne.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Budget grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBudgets.map((budget) => {
            const percentage = budget.percentage_used ?? 0
            const clampedPercentage = Math.min(percentage, 100)
            const budgetAmount = budget.budget_amount ?? 0
            const realAmount = budget.real_amount ?? 0
            const remaining = budget.remaining ?? 0
            const categoryId = budget.category_id ?? ''

            return (
              <Card
                key={`${categoryId}-${budget.account_id}`}
                className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]"
              >
                <CardContent className="p-5">
                  {/* Header: icon + name + actions */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl flex-shrink-0">
                        {budget.category_icon || '📁'}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {budget.category_name || 'Sans nom'}
                        </h3>
                        {budget.account_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {budget.account_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {getStatusBadge(percentage)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDelete(categoryId)}
                            disabled={deleting === categoryId}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deleting === categoryId
                              ? 'Suppression...'
                              : 'Supprimer'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="relative mb-3">
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          getProgressColor(percentage)
                        )}
                        style={{ width: `${clampedPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold">
                        {formatCurrency(realAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        sur {formatCurrency(budgetAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'text-xl font-bold',
                          percentage > 100
                            ? 'text-red-500'
                            : percentage >= 80
                              ? 'text-orange-500'
                              : 'text-green-500'
                        )}
                      >
                        {Math.round(percentage)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {remaining >= 0
                          ? `${formatCurrency(remaining)} restant`
                          : `${formatCurrency(Math.abs(remaining))} depasse`}
                      </p>
                    </div>
                  </div>

                  {/* Period */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                      {MONTHS[(budget.month ?? 1) - 1]} {budget.year}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
