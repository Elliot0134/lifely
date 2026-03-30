import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { ActiveBudgets } from '@/components/dashboard/active-budgets'

export default function DashboardPage() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-background/20 backdrop-blur-md rounded-xl p-1.5 md:rounded-b-none md:p-0 md:border-b flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
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
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
        {/* Header avec bienvenue */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos finances personnelles
          </p>
        </div>

        {/* KPI Cards avec vraies données Supabase */}
        <KPICards />

        {/* Graphiques avec vraies données */}
        <DashboardCharts />

        {/* Transactions récentes + Budgets actifs */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <RecentTransactions />
          <ActiveBudgets />
        </div>
      </div>
    </>
  )
}