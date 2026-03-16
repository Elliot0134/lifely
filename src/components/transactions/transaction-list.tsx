'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { useTransactions } from '@/lib/queries'
import { formatCurrency, formatDateRelative, getTransactionTypeColor, getTransactionTypeLabel } from '@/lib/utils'
import { TransactionModal } from './transaction-modal'
import {
  TransactionFilters,
  DEFAULT_FILTERS,
  periodToDateRange,
  type TransactionFilterState,
} from './transaction-filters'

export function TransactionList() {
  const [filters, setFilters] = useState<TransactionFilterState>(DEFAULT_FILTERS)

  // Build API query params from filter state
  const queryFilters = useMemo(() => {
    const dateRange = periodToDateRange(filters.period)
    return {
      type: filters.type,
      category_id: filters.category_id,
      account_id: filters.account_id,
      ...dateRange,
      page: 1,
      limit: 50,
    }
  }, [filters.type, filters.category_id, filters.account_id, filters.period])

  const { data: transactionsData, isLoading, error } = useTransactions(queryFilters)

  const transactions = transactionsData?.data || []

  // Client-side search filter (description) and sorting
  const filteredAndSorted = useMemo(() => {
    let result = [...transactions]

    // Search by description
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase().trim()
      result = result.filter((t: { description?: string | null; category?: { name?: string } }) => {
        const desc = (t.description || '').toLowerCase()
        const catName = (t.category?.name || '').toLowerCase()
        return desc.includes(query) || catName.includes(query)
      })
    }

    // Sort
    result.sort((a: { date: string; amount: number }, b: { date: string; amount: number }) => {
      switch (filters.sort) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'amount-desc':
          return b.amount - a.amount
        case 'amount-asc':
          return a.amount - b.amount
        case 'date-desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

    return result
  }, [transactions, filters.search, filters.sort])

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Erreur lors du chargement des transactions</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Filters */}
      <TransactionFilters filters={filters} onChange={setFilters} />

      {/* Transaction list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Toutes les transactions
            {!isLoading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredAndSorted.length})
              </span>
            )}
          </CardTitle>
          <TransactionModal />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSorted.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSorted.map((transaction: {
                id: string
                description?: string | null
                date: string
                amount: number
                transaction_type: string
                type: string
                category?: { icon?: string; name?: string }
                account?: { name?: string }
              }) => {
                const txType = (transaction.transaction_type || transaction.type) as import('@/types').TransactionType
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `hsl(${getTransactionTypeColor(txType)} / 0.1)`,
                          color: getTransactionTypeColor(txType),
                        }}
                      >
                        <span>{transaction.category?.icon || '📁'}</span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {transaction.description || transaction.category?.name || 'Transaction'}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            {formatDateRelative(transaction.date)}
                          </p>
                          {transaction.account?.name && (
                            <Badge variant="secondary" className="text-xs">
                              {transaction.account.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-medium"
                        style={{ color: getTransactionTypeColor(txType) }}
                      >
                        {formatCurrency(transaction.amount, txType)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getTransactionTypeLabel(txType)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-4">
                <Search className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <p className="text-lg font-medium mb-2">Aucune transaction trouvée</p>
              <p className="text-sm mb-4">
                {filters.search || filters.type !== 'all' || filters.category_id !== 'all' || filters.account_id !== 'all'
                  ? 'Essayez de modifier vos filtres ou ajoutez votre première transaction.'
                  : 'Commencez par ajouter votre première transaction.'
                }
              </p>
              <TransactionModal />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
