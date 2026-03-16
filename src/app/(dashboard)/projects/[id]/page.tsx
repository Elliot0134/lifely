'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Pencil, ListChecks, Calendar } from 'lucide-react'

import { useProject } from '@/lib/queries/task-projects'
import { useTasks } from '@/lib/queries/tasks'
import { PROJECT_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ProjectModal } from '@/components/projects/project-modal-tasks'
import { TaskList, TaskListSkeleton, TaskListEmpty } from '@/components/tasks/task-list'
import { TaskQuickAdd } from '@/components/tasks/task-quick-add'
import type { Project } from '@/types/tasks'

function getStatusConfig(status: string) {
  return PROJECT_STATUSES.find((s) => s.value === status) ?? PROJECT_STATUSES[0]
}

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <Card className="bg-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
        </CardContent>
      </Card>

      {/* Tasks skeleton */}
      <Card className="bg-card">
        <CardContent className="p-6">
          <TaskListSkeleton />
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const [editingProject, setEditingProject] = useState<Project | undefined>()

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId)
  const { data: tasks, isLoading: tasksLoading } = useTasks({ project_id: projectId })

  if (projectLoading) {
    return (
      <>
        <Header projectName={undefined} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ProjectDetailSkeleton />
        </div>
      </>
    )
  }

  if (projectError || !project) {
    return (
      <>
        <Header projectName={undefined} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-destructive mb-4">
                {projectError ? 'Erreur lors du chargement du projet.' : 'Projet introuvable.'}
              </p>
              <Button asChild variant="outline">
                <Link href="/projects">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour aux projets
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const statusConfig = getStatusConfig(project.status)
  const taskCount = project.task_count ?? tasks?.length ?? 0
  const completedCount = project.completed_task_count ?? tasks?.filter((t) => t.is_completed).length ?? 0
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0

  return (
    <>
      <Header projectName={project.name} />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Back link */}
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux projets
            </Link>
          </Button>
        </div>

        {/* Project Header Card */}
        <Card className="bg-card">
          <CardContent className="p-6">
            {/* Top: name + edit button */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {project.color && (
                  <span
                    className="h-4 w-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                )}
                <h1 className="text-xl font-bold tracking-tight truncate">
                  {project.name}
                </h1>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProject(project)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            </div>

            {/* Description */}
            {project.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {project.description}
              </p>
            )}

            {/* Badges: company + status */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {project.company && (
                <Badge variant="secondary" className="text-xs">
                  {project.company.color && (
                    <span
                      className="h-2 w-2 rounded-full mr-1.5 inline-block"
                      style={{ backgroundColor: project.company.color }}
                    />
                  )}
                  {project.company.name}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: statusConfig.color,
                  color: statusConfig.color,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full mr-1.5 inline-block"
                  style={{ backgroundColor: statusConfig.color }}
                />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    progress === 100
                      ? 'bg-[hsl(142,76%,36%)]'
                      : progress > 0
                        ? 'bg-[hsl(45,93%,47%)]'
                        : 'bg-muted-foreground/20'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Task count + progress */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ListChecks className="h-4 w-4" />
                {completedCount}/{taskCount} tache{taskCount !== 1 ? 's' : ''}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>

            {/* Dates */}
            {(project.start_date || project.end_date) && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {project.start_date &&
                    new Date(project.start_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  {project.start_date && project.end_date && ' - '}
                  {project.end_date &&
                    new Date(project.end_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Taches du projet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick add scoped to this project */}
            <TaskQuickAdd project_id={projectId} />

            {/* Task list */}
            {tasksLoading ? (
              <TaskListSkeleton />
            ) : tasks && tasks.length > 0 ? (
              <TaskList tasks={tasks} />
            ) : (
              <TaskListEmpty />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit modal */}
      {editingProject && (
        <ProjectModal
          project={editingProject}
          defaultOpen
          onOpenChange={(open) => {
            if (!open) setEditingProject(undefined)
          }}
        />
      )}
    </>
  )
}

// ─── Header component ────────────────────────────────────

function Header({ projectName }: { projectName: string | undefined }) {
  return (
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
              <BreadcrumbLink href="/projects">Projets</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {projectName ?? 'Chargement...'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
