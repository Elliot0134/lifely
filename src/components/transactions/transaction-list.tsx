'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Inbox, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTransactions } from '@/lib/queries'
import { formatCurrency, formatDateRelative, getTransactionTypeColor, getTransactionTypeLabel } from '@/lib/utils'
import { TransactionModal } from './transaction-modal'
import {
  TransactionFilters,
  DEFAULT_FILTERS,
  periodToDateRange,
  type TransactionFilterState,
} from './transaction-filters'

const ITEMS_PER_PAGE = 20

export function TransactionList() {
  const [filters, setFilters] = useState<TransactionFilterState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  // Reset page when filters change
  const handleFiltersChange = (newFilters: TransactionFilterState) => {
    setFilters(newFilters)
    setPage(1)
  }

  // Build API query params from filter state
  const queryFilters = useMemo(() => {
    const dateRange = periodToDateRange(filters.period)
    return {
      type: filters.type,
      category_id: filters.category_id,
      account_id: filters.account_id,
      ...dateRange,
      page,
      limit: ITEMS_PER_PAGE,
    }
  }, [filters.type, filters.category_id, filters.account_id, filters.period, page])

  const { data: transactionsData, isLoading, error } = useTransactions(queryFilters)

  const transactions = transactionsData?.data || []
  const pagination = transactionsData?.pagination

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

  // Pagination info
  const totalPages = pagination?.totalPages || 1
  const total = pagination?.total || filteredAndSorted.length

  if (error) {
    return (
      <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Erreur lors du chargement des transactions</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
              Reessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Filters */}
      <TransactionFilters filters={filters} onChange={handleFiltersChange} />

      {/* Transaction list */}
      <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            Toutes les transactions
            {!isLoading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({total})
              </span>
            )}
          </CardTitle>
          <TransactionModal
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle transaction
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background/60">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div>
                      <Skeleton className="h-4 w-28 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSorted.length > 0 ? (
            <>
              {/* Transaction rows */}
              <div className="space-y-1.5">
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
                  const typeColor = getTransactionTypeColor(txType)
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-background/60 hover:bg-background transition-colors cursor-default"
                    >
                      {/* Left: icon + info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{
                            backgroundColor: `${typeColor}15`,
                            color: typeColor,
                          }}
                        >
                          <span>{transaction.category?.icon || '📁'}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {transaction.description || transaction.category?.name || 'Transaction'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-muted-foreground truncate">
                              {transaction.category?.name || getTransactionTypeLabel(txType)}
                            </span>
                            {transaction.account?.name && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                                {transaction.account.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: amount + date */}
                      <div className="text-right shrink-0 ml-3">
                        <p
                          className="font-semibold text-sm tabular-nums"
                          style={{ color: typeColor }}
                        >
                          {formatCurrency(transaction.amount, txType)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateRelative(transaction.date)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Precedent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="text-center py-12">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">Aucune transaction trouvee</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                {filters.search || filters.type !== 'all' || filters.category_id !== 'all' || filters.account_id !== 'all'
                  ? 'Essayez de modifier vos filtres ou ajoutez une nouvelle transaction.'
                  : 'Commencez par ajouter votre premiere transaction pour suivre vos finances.'
                }
              </p>
              <TransactionModal
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle transaction
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
