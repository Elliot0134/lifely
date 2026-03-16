'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Repeat,
  Pencil,
  Trash2,
  CalendarClock,
  Code2,
  Plus,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

import {
  useRecurringTasks,
  useUpdateRecurringTask,
  useDeleteRecurringTask,
} from '@/lib/queries/recurring-tasks'
import { RECURRENCE_FREQUENCIES, TASK_URGENCIES } from '@/lib/constants'
import { RecurringTaskModal } from './recurring-task-modal'
import type { RecurringTask } from '@/types/tasks'

function getFrequencyLabel(frequency: string): string {
  return (
    RECURRENCE_FREQUENCIES.find((f) => f.value === frequency)?.label ?? frequency
  )
}

function formatNextDue(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr })
  } catch {
    return dateStr
  }
}

// ─── Single recurring task item ───────────────────────────

interface RecurringTaskItemProps {
  task: RecurringTask
  onEdit: (task: RecurringTask) => void
  onDelete: (task: RecurringTask) => void
}

function RecurringTaskItem({ task, onEdit, onDelete }: RecurringTaskItemProps) {
  const updateMutation = useUpdateRecurringTask()

  const handleToggleActive = (checked: boolean) => {
    updateMutation.mutate({
      id: task.id,
      is_active: checked,
    })
  }

  const urgency = TASK_URGENCIES.find((u) => u.value === task.urgency)

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      {/* Toggle active */}
      <Switch
        checked={task.is_active}
        onCheckedChange={handleToggleActive}
        disabled={updateMutation.isPending}
        aria-label={`Activer/desactiver ${task.title}`}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium text-sm truncate ${
              !task.is_active ? 'text-muted-foreground line-through' : ''
            }`}
          >
            {task.title}
          </span>
          {task.is_code_task && (
            <Code2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          {urgency && (
            <Badge
              variant="outline"
              className="text-xs shrink-0"
              style={{ borderColor: urgency.color, color: urgency.color }}
            >
              {urgency.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Repeat className="h-3 w-3" />
            {getFrequencyLabel(task.frequency)}
          </span>
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            {formatNextDue(task.next_due_date)}
          </span>
          {task.project && (
            <span className="flex items-center gap-1">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: task.project.color ?? '#64748b' }}
              />
              {task.project.name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(task)}
          aria-label="Modifier"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(task)}
          aria-label="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────

export function RecurringTaskListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-5 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main list component ──────────────────────────────────

export function RecurringTaskList() {
  const { data: recurringTasks, isLoading, error } = useRecurringTasks()
  const deleteMutation = useDeleteRecurringTask()

  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null)
  const [deletingTask, setDeletingTask] = useState<RecurringTask | null>(null)
  const [isOpen, setIsOpen] = useState(true)

  const handleConfirmDelete = () => {
    if (!deletingTask) return
    deleteMutation.mutate(deletingTask.id, {
      onSuccess: () => setDeletingTask(null),
    })
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-transparent">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Repeat className="h-5 w-5" />
                    Taches recurrentes
                    {recurringTasks && (
                      <Badge variant="secondary" className="ml-1">
                        {recurringTasks.length}
                      </Badge>
                    )}
                  </CardTitle>
                </Button>
              </CollapsibleTrigger>
              <RecurringTaskModal
                trigger={
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                }
              />
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* Loading */}
              {isLoading && <RecurringTaskListSkeleton />}

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive text-center py-4">
                  Erreur lors du chargement des taches recurrentes
                </p>
              )}

              {/* Empty state */}
              {!isLoading && !error && recurringTasks?.length === 0 && (
                <div className="text-center py-8">
                  <Repeat className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucune tache recurrente configuree
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatisez les taches qui reviennent regulierement
                  </p>
                </div>
              )}

              {/* List */}
              {!isLoading && !error && recurringTasks && recurringTasks.length > 0 && (
                <div className="space-y-2">
                  {recurringTasks.map((task) => (
                    <RecurringTaskItem
                      key={task.id}
                      task={task}
                      onEdit={setEditingTask}
                      onDelete={setDeletingTask}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Edit modal */}
      {editingTask && (
        <RecurringTaskModal
          recurringTask={editingTask}
          trigger={undefined}
          defaultOpen
          onOpenChange={(open) => {
            if (!open) setEditingTask(null)
          }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingTask}
        onOpenChange={(open) => {
          if (!open) setDeletingTask(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette tache recurrente ?</AlertDialogTitle>
            <AlertDialogDescription>
              La tache recurrente &laquo; {deletingTask?.title} &raquo; sera
              definitivement supprimee. Les taches deja generees ne seront pas affectees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
