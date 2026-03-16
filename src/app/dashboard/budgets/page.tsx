import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
import { BudgetModal } from '@/components/budgets/budget-modal'

export default async function BudgetsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirection si non authentifié
  if (!user) {
    redirect('/login')
  }

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
            <BudgetModal />
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
              {/* Message pour API */}
              <div className="text-center py-8 text-muted-foreground">
                <p>Les API routes budgets sont prêtes avec la vue v_budget_vs_real !</p>
                <p className="text-sm mt-2">Prochaine étape : intégrer les hooks React Query.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}