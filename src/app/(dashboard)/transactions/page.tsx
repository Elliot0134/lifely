import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, RotateCcw } from 'lucide-react'

export default function TransactionsPage() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-background/20 backdrop-blur-md rounded-xl p-1.5 md:rounded-none md:p-0 md:border-b flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Transactions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Gérez vos revenus et dépenses
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Récurrences
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle transaction
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <label className="text-sm font-medium">Type</label>
                <div className="mt-1 p-2 border rounded-md text-muted-foreground">
                  Tous les types
                </div>
              </div>
              <div className="flex-1 min-w-48">
                <label className="text-sm font-medium">Catégorie</label>
                <div className="mt-1 p-2 border rounded-md text-muted-foreground">
                  Toutes les catégories
                </div>
              </div>
              <div className="flex-1 min-w-48">
                <label className="text-sm font-medium">Période</label>
                <div className="mt-1 p-2 border rounded-md text-muted-foreground">
                  Ce mois-ci
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Toutes les transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Transaction factice 1 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <span>💰</span>
                  </div>
                  <div>
                    <p className="font-medium">Salaire</p>
                    <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">+3 200,00 €</p>
                  <p className="text-sm text-muted-foreground">Revenu</p>
                </div>
              </div>

              {/* Transaction factice 2 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <span>🛒</span>
                  </div>
                  <div>
                    <p className="font-medium">Courses</p>
                    <p className="text-sm text-muted-foreground">Hier</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-600">-85,30 €</p>
                  <p className="text-sm text-muted-foreground">Alimentation</p>
                </div>
              </div>

              {/* Message pour DB */}
              <div className="text-center py-8 text-muted-foreground">
                <p>Les vraies transactions apparaîtront ici une fois la base de données configurée.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}