'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateRelative, getTransactionTypeColor } from '@/lib/utils'
import { TransactionType } from '@/types'

interface RecentTransaction {
  id: string
  description: string | null
  amount: number
  date: string
  type: TransactionType
  categories: {
    name: string
    icon: string | null
    color: string | null
  } | null
}

function RecentTransactionsSkeleton() {
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecentTransactions() {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        const { data, error: fetchError } = await supabase
          .from('transactions')
          .select('id, description, amount, date, type, categories(name, icon, color)')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(5)

        if (fetchError) throw fetchError

        setTransactions((data as unknown as RecentTransaction[]) || [])
      } catch (err) {
        console.error('Error fetching recent transactions:', err)
        setError('Erreur lors du chargement des transactions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentTransactions()
  }, [])

  if (isLoading) return <RecentTransactionsSkeleton />

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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">Transactions recentes</CardTitle>
        <Link
          href="/dashboard/transactions"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Voir tout
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            Aucune transaction pour le moment
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const icon = tx.categories?.icon || '💰'
              const categoryName = tx.categories?.name || 'Sans categorie'
              const color = getTransactionTypeColor(tx.type)

              return (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-base">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.description || categoryName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateRelative(tx.date)}
                    </p>
                  </div>
                  <span
                    className="text-sm font-semibold whitespace-nowrap"
                    style={{ color }}
                  >
                    {formatCurrency(tx.amount, tx.type)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
