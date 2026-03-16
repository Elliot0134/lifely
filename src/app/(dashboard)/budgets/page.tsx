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
import { Plus, Copy } from 'lucide-react'

export default function BudgetsPage() {
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
                <BreadcrumbPage>Budgets</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground">
              Définir et suivre vos objectifs financiers
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Copy className="mr-2 h-4 w-4" />
              Copier le mois précédent
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau budget
            </Button>
          </div>
        </div>

        {/* Sélecteur période */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium">Mois</label>
                <div className="mt-1 p-2 border rounded-md min-w-32">Février 2024</div>
              </div>
              <div>
                <label className="text-sm font-medium">Année</label>
                <div className="mt-1 p-2 border rounded-md min-w-24">2024</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget vs Réel */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Réel - Février 2024</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Exemple budget 1 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>🛒</span>
                    <span className="font-medium">Alimentation</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">280€ / 350€</span>
                    <span className="text-sm text-muted-foreground ml-2">80%</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>

              {/* Exemple budget 2 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>🚗</span>
                    <span className="font-medium">Transport</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">120€ / 150€</span>
                    <span className="text-sm text-muted-foreground ml-2">80%</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>

              {/* Budget dépassé */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>🎮</span>
                    <span className="font-medium">Loisirs</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">DÉPASSÉ</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-red-600">190€ / 100€</span>
                    <span className="text-sm text-muted-foreground ml-2">190%</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Message */}
              <div className="text-center py-4 text-muted-foreground">
                <p>Les vrais budgets apparaîtront ici une fois la base de données configurée.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}