'use client'

import { useState } from 'react'
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  FolderKanban,
  MoreVertical,
  Pencil,
  Trash2,
  ListChecks,
  Loader2,
} from 'lucide-react'

import { useProjects, useDeleteProject } from '@/lib/queries/task-projects'
import { useCompanies } from '@/lib/queries/companies'
import { PROJECT_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ProjectModal } from '@/components/projects/project-modal-tasks'
import type { Project } from '@/types/tasks'

function getStatusConfig(status: string) {
  return PROJECT_STATUSES.find((s) => s.value === status) ?? PROJECT_STATUSES[0]
}

function ProjectCardSkeleton() {
  return (
    <Card className="bg-card">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-7 w-7 rounded" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
  isDeleting,
}: {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  isDeleting: boolean
}) {
  const statusConfig = getStatusConfig(project.status)
  const taskCount = project.task_count ?? 0
  const completedCount = project.completed_task_count ?? 0
  const progress = project.progress ?? (taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0)

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="bg-card hover:border-foreground/20 transition-colors cursor-pointer">
        <CardContent className="p-5">
          {/* Header: color + name + actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {project.color && (
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                {project.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault()
                    onEdit(project)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    onDelete(project)
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Company badge + Status */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {project.company && (
              <Badge variant="secondary" className="text-xs">
                {project.company.color && (
                  <span
                    className="h-2 w-2 rounded-full mr-1 inline-block"
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
                className="h-1.5 w-1.5 rounded-full mr-1 inline-block"
                style={{ backgroundColor: statusConfig.color }}
              />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
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

          {/* Task count + progress % */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              {completedCount}/{taskCount} tache{taskCount !== 1 ? 's' : ''}
            </span>
            <span className="font-medium">{progress}%</span>
          </div>

          {/* Dates */}
          {(project.start_date || project.end_date) && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                {project.start_date &&
                  new Date(project.start_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                {project.start_date && project.end_date && ' - '}
                {project.end_date &&
                  new Date(project.end_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export default function ProjectsPage() {
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  const filters = companyFilter ? { company_id: companyFilter } : {}
  const { data: projects, isLoading, error } = useProjects(filters)
  const { data: companies } = useCompanies()
  const deleteMutation = useDeleteProject()

  const handleDelete = async () => {
    if (!deletingProject) return
    try {
      await deleteMutation.mutateAsync(deletingProject.id)
    } catch {
      // Handled by mutation hook
    } finally {
      setDeletingProject(null)
    }
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
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Projets</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Projets</h1>
            <p className="text-muted-foreground">
              Gerez vos projets et suivez leur avancement
            </p>
          </div>
          <div className="flex gap-2">
            <ProjectModal />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={companyFilter || '__all__'}
            onValueChange={(v) => setCompanyFilter(v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Toutes les entreprises" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Toutes les entreprises</SelectItem>
              {companies?.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  <span className="flex items-center gap-2">
                    {company.color && (
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: company.color }}
                      />
                    )}
                    {company.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-destructive">
                Erreur lors du chargement des projets.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !error && projects?.length === 0 && (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FolderKanban className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Aucun projet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Commencez par creer un projet pour organiser vos taches.
              </p>
              <ProjectModal />
            </CardContent>
          </Card>
        )}

        {/* Project grid */}
        {!isLoading && !error && projects && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={setEditingProject}
                onDelete={setDeletingProject}
                isDeleting={
                  deleteMutation.isPending &&
                  deletingProject?.id === project.id
                }
              />
            ))}
          </div>
        )}
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

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingProject}
        onOpenChange={(open) => {
          if (!open) setDeletingProject(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le projet</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer le projet &quot;{deletingProject?.name}&quot; ?
              Cette action est irreversible et supprimera toutes les taches associees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
