'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Plus } from 'lucide-react'
import { useCategories } from '@/lib/queries'
import { getTransactionTypeColor, getTransactionTypeLabel } from '@/lib/utils'

export function CategoryList() {
  const { data, isLoading, error } = useCategories()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Erreur lors du chargement des catégories</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const categories = data?.data || []
  const groupedCategories = data?.grouped || {}

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-6 h-6" />
                      <div>
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Skeleton className="w-8 h-8" />
                      <Skeleton className="w-8 h-8" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Types de transaction pour organiser l'affichage
  const transactionTypes = [
    { key: 'revenue', label: 'Revenus', color: getTransactionTypeColor('revenue') },
    { key: 'variable_expense', label: 'Dépenses variables', color: getTransactionTypeColor('variable_expense') },
    { key: 'fixed_expense', label: 'Charges fixes', color: getTransactionTypeColor('fixed_expense') },
    { key: 'credit', label: 'Crédits', color: getTransactionTypeColor('credit') },
    { key: 'savings', label: 'Épargne', color: getTransactionTypeColor('savings') },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {transactionTypes.map((type) => {
        const typeCategories = groupedCategories[type.key] || []

        return (
          <Card key={type.key}>
            <CardHeader>
              <CardTitle
                className="text-base flex items-center gap-2"
                style={{ color: type.color }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                {type.label}
                <Badge variant="secondary" className="ml-auto">
                  {typeCategories.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {typeCategories.length > 0 ? (
                <div className="space-y-3">
                  {typeCategories.map((category: any) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{category.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{category.name}</p>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {category.is_default ? 'défaut' : 'personnalisé'}
                            </span>
                            <Badge variant="outline" className="text-xs px-1">
                              {category.account?.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        {!category.is_default && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Aucune catégorie</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}