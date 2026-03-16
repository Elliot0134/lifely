'use client'

import { useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Filter, Search, X } from 'lucide-react'
import { useCategories, useAccounts } from '@/lib/queries'
import { TRANSACTION_TYPES } from '@/lib/constants'

export type PeriodValue = 'current-month' | 'last-month' | '3-months' | '6-months' | 'year' | 'all'
export type SortValue = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

export interface TransactionFilterState {
  search: string
  type: string
  category_id: string
  account_id: string
  period: PeriodValue
  sort: SortValue
}

export const DEFAULT_FILTERS: TransactionFilterState = {
  search: '',
  type: 'all',
  category_id: 'all',
  account_id: 'all',
  period: 'current-month',
  sort: 'date-desc',
}

const PERIOD_OPTIONS: { value: PeriodValue; label: string }[] = [
  { value: 'current-month', label: 'Ce mois' },
  { value: 'last-month', label: 'Mois dernier' },
  { value: '3-months', label: '3 mois' },
  { value: '6-months', label: '6 mois' },
  { value: 'year', label: 'Année' },
  { value: 'all', label: 'Tout' },
]

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'date-desc', label: 'Date récente' },
  { value: 'date-asc', label: 'Date ancienne' },
  { value: 'amount-desc', label: 'Montant décroissant' },
  { value: 'amount-asc', label: 'Montant croissant' },
]

interface TransactionFiltersProps {
  filters: TransactionFilterState
  onChange: (filters: TransactionFilterState) => void
}

/**
 * Compute date_from and date_to from a period preset.
 */
export function periodToDateRange(period: PeriodValue): { date_from?: string; date_to?: string } {
  const now = new Date()

  switch (period) {
    case 'current-month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return {
        date_from: start.toISOString().split('T')[0],
        date_to: end.toISOString().split('T')[0],
      }
    }
    case 'last-month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        date_from: start.toISOString().split('T')[0],
        date_to: end.toISOString().split('T')[0],
      }
    }
    case '3-months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      return {
        date_from: start.toISOString().split('T')[0],
        date_to: now.toISOString().split('T')[0],
      }
    }
    case '6-months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      return {
        date_from: start.toISOString().split('T')[0],
        date_to: now.toISOString().split('T')[0],
      }
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date(now.getFullYear(), 11, 31)
      return {
        date_from: start.toISOString().split('T')[0],
        date_to: end.toISOString().split('T')[0],
      }
    }
    case 'all':
    default:
      return {}
  }
}

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  const { data: categoriesData } = useCategories()
  const { data: accountsData } = useAccounts()

  const categories = categoriesData?.data || []
  const accounts = accountsData?.data || []

  // Filter categories by selected type
  const filteredCategories = useMemo(() => {
    if (filters.type === 'all') return categories
    return categories.filter((c: { transaction_type: string }) => c.transaction_type === filters.type)
  }, [categories, filters.type])

  const updateFilter = useCallback(
    <K extends keyof TransactionFilterState>(key: K, value: TransactionFilterState[K]) => {
      const next = { ...filters, [key]: value }
      // Reset category when type changes (selected category may not belong to new type)
      if (key === 'type' && value !== filters.type) {
        next.category_id = 'all'
      }
      onChange(next)
    },
    [filters, onChange],
  )

  const hasActiveFilters =
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.category_id !== 'all' ||
    filters.account_id !== 'all' ||
    filters.period !== 'current-month' ||
    filters.sort !== 'date-desc'

  const resetFilters = useCallback(() => {
    onChange(DEFAULT_FILTERS)
  }, [onChange])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtres
        </CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-muted-foreground">
            <X className="mr-1 h-3 w-3" />
            Réinitialiser
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search bar - full width */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par description..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter selects grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-type">Type</Label>
            <Select value={filters.type} onValueChange={(v) => updateFilter('type', v)}>
              <SelectTrigger id="filter-type">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {TRANSACTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-category">Catégorie</Label>
            <Select value={filters.category_id} onValueChange={(v) => updateFilter('category_id', v)}>
              <SelectTrigger id="filter-category">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {filteredCategories.map((cat: { id: string; icon: string; name: string }) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-account">Compte</Label>
            <Select value={filters.account_id} onValueChange={(v) => updateFilter('account_id', v)}>
              <SelectTrigger id="filter-account">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les comptes</SelectItem>
                {accounts.map((acc: { id: string; name: string }) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-period">Période</Label>
            <Select value={filters.period} onValueChange={(v) => updateFilter('period', v as PeriodValue)}>
              <SelectTrigger id="filter-period">
                <SelectValue placeholder="Ce mois" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-sort">Tri</Label>
            <Select value={filters.sort} onValueChange={(v) => updateFilter('sort', v as SortValue)}>
              <SelectTrigger id="filter-sort">
                <SelectValue placeholder="Date récente" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
