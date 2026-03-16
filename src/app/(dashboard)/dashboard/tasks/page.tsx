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
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { useTasks } from '@/lib/queries/tasks'
import { TaskList, TaskListSkeleton } from '@/components/tasks/task-list'
import { RecurringTaskList } from '@/components/tasks/recurring-task-list'

export default function TasksPage() {
  // Fetch top-level tasks only (no subtasks)
  const { data: tasks, isLoading, error } = useTasks({ parent_task_id: null })

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
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Taches</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Taches</h1>
            <p className="text-muted-foreground">
              Gerez et suivez toutes vos taches
            </p>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>Erreur lors du chargement des taches</p>
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

        {/* Loading state */}
        {isLoading && <TaskListSkeleton />}

        {/* Task list */}
        {!isLoading && !error && tasks && <TaskList tasks={tasks} />}

        {/* Recurring tasks section */}
        <RecurringTaskList />
      </div>
    </>
  )
}
