"use client"

import { useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Calendar,
  Clock,
  Code,
  FolderOpen,
  ListTree,
  MessageSquare,
  Pencil,
  Terminal,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { TASK_DUE_STATUS_COLORS, TASK_URGENCIES } from "@/lib/constants"
import { useDeleteTask } from "@/lib/queries/tasks"
import type { Task, TaskDueStatus } from "@/types/tasks"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
} from "@/components/ui/alert-dialog"
import { TagBadge } from "@/components/tags/tag-badge"

// ─── Props ──────────────────────────────────────────────

interface TaskDetailPanelProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (task: Task) => void
}

// ─── Helpers ────────────────────────────────────────────

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate)
  return format(date, "EEEE d MMMM yyyy", { locale: fr })
}

function formatEstimation(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`
}

function getDueStatusLabel(status: TaskDueStatus): string {
  const labels: Record<TaskDueStatus, string> = {
    overdue: "En retard",
    today: "Aujourd'hui",
    upcoming: "Bientôt",
    future: "À venir",
    no_date: "Pas de date",
    completed: "Terminée",
  }
  return labels[status] ?? status
}

// ─── Component ──────────────────────────────────────────

export function TaskDetailPanel({
  task,
  open,
  onOpenChange,
  onEdit,
}: TaskDetailPanelProps) {
  const deleteTask = useDeleteTask()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (!task) return null

  const urgencyConfig = task.urgency
    ? TASK_URGENCIES.find((u) => u.value === task.urgency)
    : null

  const dueStatusColor = task.due_status
    ? TASK_DUE_STATUS_COLORS[task.due_status as TaskDueStatus]
    : undefined

  const hasSubtasks = (task.subtask_count ?? 0) > 0

  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        onOpenChange(false)
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
        showCloseButton
      >
        {/* Header */}
        <SheetHeader className="pr-8">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <SheetTitle
                className={cn(
                  "text-lg leading-tight",
                  task.is_completed && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Détails de la tâche {task.title}
              </SheetDescription>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(task)}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" />
                Modifier
              </Button>
            )}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer la tâche</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer &quot;{task.title}&quot; ?
                    {hasSubtasks && " Toutes les sous-tâches seront également supprimées."}
                    {" "}Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SheetHeader>

        <Separator />

        {/* Body */}
        <div className="space-y-5 px-4 pb-6">
          {/* ─── Metadata ─────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Détails
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* Project */}
              {task.project_name && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <FolderOpen className="size-3" />
                    Projet
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: task.project_color ?? "#64748b" }}
                    />
                    <span className="font-medium">{task.project_name}</span>
                  </div>
                </div>
              )}

              {/* Urgency */}
              {urgencyConfig && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Urgence</span>
                  <div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: `${urgencyConfig.color}50`,
                        backgroundColor: `${urgencyConfig.color}15`,
                        color: urgencyConfig.color,
                      }}
                    >
                      {urgencyConfig.label}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Due date */}
              {task.due_date && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    Échéance
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {formatDueDate(task.due_date)}
                    </span>
                    {task.due_status && task.due_status !== "completed" && (
                      <span
                        className="text-xs font-medium"
                        style={{ color: dueStatusColor }}
                      >
                        {getDueStatusLabel(task.due_status as TaskDueStatus)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Estimation */}
              {task.estimated_minutes && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    Estimation
                  </span>
                  <span className="font-medium">
                    {formatEstimation(task.estimated_minutes)}
                  </span>
                </div>
              )}

              {/* Code task */}
              {task.is_code_task && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Code className="size-3" />
                    Type
                  </span>
                  <Badge
                    variant="outline"
                    className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs"
                  >
                    <Code className="size-3" />
                    Tâche code
                  </Badge>
                </div>
              )}

              {/* Subtask counter */}
              {hasSubtasks && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ListTree className="size-3" />
                    Sous-tâches
                  </span>
                  <span className="font-medium">
                    {task.subtask_completed_count ?? 0}/{task.subtask_count} terminées
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ─── Tags ─────────────────────────────── */}
          {task.tags && task.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── Description ──────────────────────── */}
          {task.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </h3>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {task.description}
                </p>
              </div>
            </>
          )}

          {/* ─── AI Instructions ──────────────────── */}
          {task.is_code_task && task.ai_instructions && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Terminal className="size-3.5" />
                  Instructions AI
                </h3>
                <pre className="rounded-lg border bg-muted/50 p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                  {task.ai_instructions}
                </pre>
              </div>
            </>
          )}

          {/* ─── Subtasks ─────────────────────────── */}
          <Separator />
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ListTree className="size-3.5" />
              Sous-tâches
              {hasSubtasks && (
                <span className="text-muted-foreground/60">
                  ({task.subtask_completed_count ?? 0}/{task.subtask_count})
                </span>
              )}
            </h3>
            {/* SubtaskList will be plugged in from US-030 */}
            {!hasSubtasks && (
              <p className="text-sm text-muted-foreground italic">
                Aucune sous-tâche
              </p>
            )}
          </div>

          {/* ─── Comments (placeholder for US-032) ── */}
          <Separator />
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              Commentaires
            </h3>
            <p className="text-sm text-muted-foreground italic">
              Les commentaires arrivent bientôt...
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
