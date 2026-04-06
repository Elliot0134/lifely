'use client'

import { useState } from 'react'
import {
  Calendar,
  ListChecks,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { PROJECT_STATUSES } from '@/lib/constants'
import { useProject, useDeleteProject, useUpdateProject } from '@/lib/queries/task-projects'
import { useTasks, useUpdateTaskStatus } from '@/lib/queries/tasks'
import type { Project, ProjectStatus, Task } from '@/types/tasks'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { ProjectModal } from '@/components/projects/project-modal-tasks'
import { TaskQuickAdd } from '@/components/tasks/task-quick-add'

// ─── Props ──────────────────────────────────────────────

interface ProjectDetailSheetProps {
  projectId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Task item ──────────────────────────────────────────

function ProjectTaskItem({ task }: { task: Task }) {
  const updateStatus = useUpdateTaskStatus()
  const isCompleted = task.status === 'completed'
  const dueLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() =>
          updateStatus.mutate({
            id: task.id,
            status: isCompleted ? 'todo' : 'completed',
          })
        }
        disabled={updateStatus.isPending}
        aria-label={`Marquer "${task.title}" comme ${isCompleted ? 'non terminée' : 'terminée'}`}
      />
      <span className={cn('flex-1 text-sm truncate', isCompleted && 'line-through text-muted-foreground')}>
        {task.title}
      </span>
      {dueLabel && (
        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {dueLabel}
        </span>
      )}
    </div>
  )
}

// ─── Component ──────────────────────────────────────────

export function ProjectDetailSheet({
  projectId,
  open,
  onOpenChange,
}: ProjectDetailSheetProps) {
  const { data: project, isLoading: projectLoading } = useProject(projectId ?? '')
  const { data: tasks, isLoading: tasksLoading } = useTasks(
    projectId ? { project_id: projectId } : {}
  )
  const updateProject = useUpdateProject()
  const deleteMutation = useDeleteProject()
  const [editingProject, setEditingProject] = useState<Project | undefined>()

  const handleDelete = async () => {
    if (!projectId) return
    try {
      await deleteMutation.mutateAsync(projectId)
      onOpenChange(false)
    } catch {
      // Handled by mutation
    }
  }

  const handleStatusChange = (status: ProjectStatus) => {
    if (!projectId) return
    updateProject.mutate({ id: projectId, status })
  }

  if (!projectId) return null

  const statusConfig = PROJECT_STATUSES.find((s) => s.value === project?.status) ?? PROJECT_STATUSES[0]
  const taskCount = tasks?.length ?? 0
  const completedCount = tasks?.filter((t) => t.status === 'completed').length ?? 0
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0

  const todoTasks = tasks?.filter((t) => t.status !== 'completed') ?? []
  const completedTasks = tasks?.filter((t) => t.status === 'completed') ?? []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[80vw] w-[80vw] h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0">
          {/* Loading */}
          {projectLoading && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="h-4 w-24" />
                <div className="space-y-2 mt-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                      <Skeleton className="h-4 w-4 rounded-[4px]" />
                      <Skeleton className="h-4 flex-1 max-w-[200px]" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Loaded */}
          {!projectLoading && project && (
            <>
              {/* Header */}
              <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {project.color && (
                      <span
                        className="size-4 rounded-full shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="text-xl font-bold truncate">
                        {project.name}
                      </DialogTitle>
                      {project.description && (
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                          {project.description}
                        </DialogDescription>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProject(project)}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Modifier
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le projet</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer &quot;{project.name}&quot; ?
                            Cette action supprimera toutes les tâches associées.
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
                  </div>
                </div>

                {/* Meta row: status + company + dates */}
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  {/* Status selector */}
                  <Select
                    value={project.status}
                    onValueChange={(v) => handleStatusChange(v as ProjectStatus)}
                  >
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {project.company && (
                    <Badge variant="secondary" className="text-xs">
                      {project.company.color && (
                        <span
                          className="size-2 rounded-full mr-1.5"
                          style={{ backgroundColor: project.company.color }}
                        />
                      )}
                      {project.company.name}
                    </Badge>
                  )}

                  {(project.start_date || project.end_date) && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {project.start_date &&
                        new Date(project.start_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      {project.start_date && project.end_date && ' → '}
                      {project.end_date &&
                        new Date(project.end_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <ListChecks className="size-3.5" />
                      {completedCount}/{taskCount} tâche{taskCount !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
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
              </DialogHeader>

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Quick add */}
                <TaskQuickAdd project_id={projectId} className="mb-4" />

                {/* Task list */}
                {tasksLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                        <Skeleton className="h-4 w-4 rounded-[4px]" />
                        <Skeleton className="h-4 flex-1 max-w-[300px]" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                ) : taskCount === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <ListChecks className="mx-auto size-10 mb-3 opacity-50" />
                    <p className="text-sm">Aucune tâche dans ce projet</p>
                    <p className="text-xs mt-1">Utilisez le champ ci-dessus pour en ajouter</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Active tasks */}
                    {todoTasks.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                          À faire ({todoTasks.length})
                        </p>
                        {todoTasks.map((task) => (
                          <ProjectTaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    )}

                    {/* Completed tasks */}
                    {completedTasks.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                          Terminées ({completedTasks.length})
                        </p>
                        {completedTasks.map((task) => (
                          <ProjectTaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
