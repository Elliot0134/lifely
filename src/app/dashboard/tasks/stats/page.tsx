'use client'

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
import { Code2, FileText } from 'lucide-react'

import { useTaskStats } from '@/lib/queries/briefing'
import { TaskStatsCards } from '@/components/stats/task-stats-cards'
import { WeeklyChart } from '@/components/stats/weekly-chart'
import { ProjectBreakdown } from '@/components/stats/project-breakdown'

function CodeRatio({
  codeCompleted,
  nonCodeCompleted,
}: {
  codeCompleted: number
  nonCodeCompleted: number
}) {
  const total = codeCompleted + nonCodeCompleted
  const codePercent = total > 0 ? Math.round((codeCompleted / total) * 100) : 0
  const nonCodePercent = total > 0 ? 100 - codePercent : 0

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base">Code vs Non-code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {total > 0 ? (
          <>
            {/* Progress bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
              {codePercent > 0 && (
                <div
                  className="bg-[#8b9a6b] transition-all"
                  style={{ width: `${codePercent}%` }}
                />
              )}
              {nonCodePercent > 0 && (
                <div
                  className="bg-[#8e8a83] transition-all"
                  style={{ width: `${nonCodePercent}%` }}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-[#8b9a6b]" />
                <span className="text-muted-foreground">Code</span>
                <span className="font-medium">{codeCompleted}</span>
                <span className="text-muted-foreground text-xs">({codePercent}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#8e8a83]" />
                <span className="text-muted-foreground">Non-code</span>
                <span className="font-medium">{nonCodeCompleted}</span>
                <span className="text-muted-foreground text-xs">({nonCodePercent}%)</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-20 flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground text-sm">
              Aucune tache completee
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function TaskStatsPage() {
  const { data: stats, isLoading, error } = useTaskStats()

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
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/tasks">Taches</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Statistiques</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>
          <p className="text-muted-foreground">
            Suivez votre productivite et vos tendances
          </p>
        </div>

        {/* Error state */}
        {error && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>Erreur lors du chargement des statistiques</p>
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
        )}

        {/* KPI Cards */}
        <TaskStatsCards stats={stats} isLoading={isLoading} />

        {/* Charts Grid */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <WeeklyChart weeklyData={stats?.weekly_data} isLoading={isLoading} />
          <ProjectBreakdown byProject={stats?.by_project} isLoading={isLoading} />
        </div>

        {/* Code vs Non-code */}
        <CodeRatio
          codeCompleted={stats?.code_tasks_completed ?? 0}
          nonCodeCompleted={stats?.non_code_tasks_completed ?? 0}
        />
      </div>
    </>
  )
}
