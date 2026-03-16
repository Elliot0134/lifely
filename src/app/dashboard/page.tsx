import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
} from 'lucide-react'
import { DashboardKPIs } from '@/components/dashboard/dashboard-kpis'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'

export default async function DashboardPage() {
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
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header avec bienvenue */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos finances personnelles
          </p>
        </div>

        {/* KPI Cards avec vraies données */}
        <DashboardKPIs />

        {/* Graphiques avec vraies données */}
        <DashboardCharts />

        {/* Message pour l'utilisateur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Lifely est en cours de construction !
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Les données sont factices pour l'instant. Les API routes sont créées et prêtes !
              Prochaine étape : connecter aux vraies données Supabase.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}