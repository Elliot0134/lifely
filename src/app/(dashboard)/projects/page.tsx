'use client'

import { useState, useMemo } from 'react'
import {
  FolderKanban,
  Loader2,
  RefreshCw,
} from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

import { useProjectsView } from '@/hooks/use-projects-view'
import { useProjects, useDeleteProject, useUpdateProject } from '@/lib/queries/task-projects'
import { ProjectToolbar } from '@/components/projects/project-toolbar'
import { ProjectBoard, ProjectBoardSkeleton } from '@/components/projects/project-board'
import { ProjectTable, ProjectTableSkeleton } from '@/components/projects/project-table'
import { ProjectModal } from '@/components/projects/project-modal-tasks'
import { ProjectDetailSheet } from '@/components/projects/project-detail-sheet'
import type { Project, ProjectStatus } from '@/types/tasks'

export default function ProjectsPage() {
  // ─── View state ───────────────────────────────────────
  const {
    viewMode,
    setViewMode,
    groupBy,
    setGroupBy,
    subGroupBy,
    setSubGroupBy,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    filters,
    setFilters,
    clearFilters,
    showCompleted,
    setShowCompleted,
    groupProjects,
    sortProjects,
  } = useProjectsView()

  // ─── Data fetching ────────────────────────────────────
  const { data: projects, isLoading, error } = useProjects(filters)

  // ─── Process projects: filter → sort → group ──────────
  const filteredProjects = useMemo(() => {
    if (!projects) return []
    // When grouped by status, always include completed so the column isn't empty
    if (showCompleted || groupBy === 'status') return projects
    return projects.filter((p) => p.status !== 'completed')
  }, [projects, showCompleted, groupBy])

  const sortedProjects = useMemo(
    () => sortProjects(filteredProjects),
    [sortProjects, filteredProjects]
  )

  const groupedProjects = useMemo(
    () => groupProjects(sortedProjects),
    [groupProjects, sortedProjects]
  )

  // ─── UI state ─────────────────────────────────────────
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // ─── Mutations ────────────────────────────────────────
  const deleteMutation = useDeleteProject()
  const updateProject = useUpdateProject()

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

  // Drag & drop between columns (status change)
  const handleMoveProject = (projectId: string, targetColumnKey: string) => {
    if (groupBy === 'status') {
      updateProject.mutate({
        id: projectId,
        status: targetColumnKey as ProjectStatus,
      })
    }
  }

  // ─── Derived state ────────────────────────────────────
  const hasFilters =
    !!filters.company_id ||
    !!filters.status ||
    !!filters.search

  const isEmpty = !isLoading && !error && filteredProjects.length === 0

  return (
    <>
      {/* ─── Header ──────────────────────────────────────── */}
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
                <BreadcrumbPage>Projets</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
        {/* Toolbar */}
        <ProjectToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          subGroupBy={subGroupBy}
          setSubGroupBy={setSubGroupBy}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          toggleSortOrder={toggleSortOrder}
          filters={filters}
          setFilters={setFilters}
          clearFilters={clearFilters}
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
          onCreateProject={() => setCreateModalOpen(true)}
        />

        {/* Loading */}
        {isLoading &&
          (viewMode === 'kanban' ? (
            <ProjectBoardSkeleton />
          ) : (
            <ProjectTableSkeleton />
          ))}

        {/* Error */}
        {error && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                <p>Erreur lors du chargement des projets</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <RefreshCw className="size-4" />
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state — no filters */}
        {isEmpty && !hasFilters && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <FolderKanban className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Aucun projet</p>
                  <p className="text-sm text-muted-foreground">
                    Créez votre premier projet pour organiser vos tâches
                  </p>
                </div>
                <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                  Nouveau projet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state — with filters */}
        {isEmpty && hasFilters && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun projet ne correspond aux filtres
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active view */}
        {!isLoading && !error && filteredProjects.length > 0 && (
          viewMode === 'kanban' ? (
            <ProjectBoard
              groupedProjects={groupedProjects}
              groupBy={groupBy}
              onSelectProject={(p) => setSelectedProjectId(p.id)}
              onMoveProject={handleMoveProject}
              onCreateProject={() => setCreateModalOpen(true)}
              showCompleted={showCompleted}
            />
          ) : (
            <ProjectTable
              groupedProjects={groupedProjects}
              groupBy={groupBy}
              onSelectProject={(p) => setSelectedProjectId(p.id)}
              showCompleted={showCompleted}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={setSortBy}
            />
          )
        )}
      </div>

      {/* ─── Detail sheet (modal) ────────────────────────── */}
      <ProjectDetailSheet
        projectId={selectedProjectId}
        open={!!selectedProjectId}
        onOpenChange={(open) => {
          if (!open) setSelectedProjectId(null)
        }}
      />

      {/* ─── Create modal ────────────────────────────────── */}
      {createModalOpen && (
        <ProjectModal
          defaultOpen
          onOpenChange={(open) => {
            if (!open) setCreateModalOpen(false)
          }}
        />
      )}

      {/* ─── Edit modal ──────────────────────────────────── */}
      {editingProject && (
        <ProjectModal
          project={editingProject}
          defaultOpen
          onOpenChange={(open) => {
            if (!open) setEditingProject(undefined)
          }}
        />
      )}

      {/* ─── Delete confirmation ────────────────────────── */}
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
              Êtes-vous sûr de vouloir supprimer le projet &quot;{deletingProject?.name}&quot; ?
              Cette action est irréversible et supprimera toutes les tâches associées.
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
