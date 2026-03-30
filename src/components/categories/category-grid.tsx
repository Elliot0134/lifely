'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Edit, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { useCategories, useDeleteCategory } from '@/lib/queries'
import { getTransactionTypeLabel } from '@/lib/utils'
import { CategoryModal } from './category-modal'
import type { TransactionType } from '@/types'

const TYPE_COLORS: Record<TransactionType, string> = {
  revenue: 'bg-[#8b9a6b]/15 text-[#8b9a6b]',
  variable_expense: 'bg-[#f26a4b]/15 text-[#f26a4b]',
  fixed_expense: 'bg-[#8e8a83]/15 text-[#8e8a83]',
  credit: 'bg-[#c45c5c]/15 text-[#c45c5c]',
  savings: 'bg-[#a89f8f]/15 text-[#a89f8f]',
}

interface CategoryWithCount {
  id: string
  name: string
  icon: string | null
  color: string | null
  transaction_type: TransactionType
  is_default: boolean | null
  sort_order: number | null
  account_id: string
  user_id: string
  created_at: string | null
  updated_at: string | null
  account?: { id: string; name: string; type: string } | null
  transactions?: { count: number }[]
}

export function CategoryGrid() {
  const { data, isLoading, error } = useCategories()
  const deleteMutation = useDeleteCategory()
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null)
  const [editTarget, setEditTarget] = useState<CategoryWithCount | null>(null)

  if (error) {
    return (
      <Card className="bg-card">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Erreur lors du chargement des categories</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Reessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card
            key={i}
            className="bg-card"
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const categories: CategoryWithCount[] = data?.data || []

  if (categories.length === 0) {
    return (
      <Card className="bg-card">
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-1">Aucune categorie</p>
            <p className="text-sm mb-4">
              Creez votre premiere categorie pour organiser vos transactions
            </p>
            <CategoryModal
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Creer une categorie
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTransactionCount = (cat: CategoryWithCount): number => {
    if (cat.transactions && cat.transactions.length > 0) {
      return cat.transactions[0].count
    }
    return 0
  }

  const handleDelete = (category: CategoryWithCount) => {
    setDeleteTarget(category)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    })
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map((category) => {
          const txCount = getTransactionCount(category)
          const typeLabel = getTransactionTypeLabel(category.transaction_type)
          const typeBadgeClass =
            TYPE_COLORS[category.transaction_type] || TYPE_COLORS.variable_expense

          return (
            <Card
              key={category.id}
              className="bg-card group relative overflow-hidden"
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  {/* Icon with color background */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: (category.color || '#6B7280') + '20',
                    }}
                  >
                    {category.icon || '📁'}
                  </div>

                  {/* Color dot + name */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: category.color || '#6B7280',
                      }}
                    />
                    <p className="font-medium text-sm truncate max-w-[120px]">
                      {category.name}
                    </p>
                  </div>

                  {/* Type badge */}
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-2 py-0 font-medium ${typeBadgeClass}`}
                  >
                    {typeLabel}
                  </Badge>

                  {/* Transaction count */}
                  <p className="text-xs text-muted-foreground">
                    {txCount} transaction{txCount !== 1 ? 's' : ''}
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CategoryModal
                      category={category}
                      trigger={
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(category)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer la categorie
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && getTransactionCount(deleteTarget) > 0 ? (
                <>
                  Cette categorie est utilisee par{' '}
                  <strong>
                    {getTransactionCount(deleteTarget)} transaction(s)
                  </strong>
                  . Vous devez d&apos;abord reassigner ou supprimer ces
                  transactions.
                </>
              ) : (
                <>
                  Etes-vous sur de vouloir supprimer la categorie{' '}
                  <strong>&quot;{deleteTarget?.name}&quot;</strong> ? Cette action
                  est irreversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            {deleteTarget && getTransactionCount(deleteTarget) === 0 && (
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
