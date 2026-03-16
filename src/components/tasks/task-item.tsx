"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Calendar,
  Clock,
  Code,
  ListTree,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { TASK_DUE_STATUS_COLORS, TASK_URGENCIES } from "@/lib/constants"
import { useToggleTask } from "@/lib/queries/tasks"
import type { Task, TaskDueStatus } from "@/types/tasks"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TagBadge } from "@/components/tags/tag-badge"

// ─── Props ──────────────────────────────────────────────

interface TaskItemProps {
  task: Task
  onSelect?: (task: Task) => void
  onEdit?: (task: Task) => void
  onSchedule?: (task: Task) => void
  onAddSubtask?: (task: Task) => void
  onDelete?: (task: Task) => void
  className?: string
}

// ─── Helpers ────────────────────────────────────────────

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const taskDate = new Date(date)
  taskDate.setHours(0, 0, 0, 0)

  if (taskDate.getTime() === today.getTime()) return "Aujourd'hui"
  if (taskDate.getTime() === tomorrow.getTime()) return "Demain"

  return format(date, "d MMM", { locale: fr })
}

function formatEstimation(minutes: number): string {
  if (minutes < 60) return `~${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `~${h}h${m.toString().padStart(2, "0")}` : `~${h}h`
}

// ─── Component ──────────────────────────────────────────

export function TaskItem({
  task,
  onSelect,
  onEdit,
  onSchedule,
  onAddSubtask,
  onDelete,
  className,
}: TaskItemProps) {
  const toggleTask = useToggleTask()

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleTask.mutate(task.id)
  }

  const urgencyConfig = task.urgency
    ? TASK_URGENCIES.find((u) => u.value === task.urgency)
    : null

  const dueStatusColor = task.due_status
    ? TASK_DUE_STATUS_COLORS[task.due_status as TaskDueStatus]
    : undefined

  const hasSubtasks =
    (task.subtask_count ?? 0) > 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect?.(task)
        }
      }}
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors",
        "hover:bg-accent/50 cursor-pointer",
        task.is_completed && "opacity-60",
        className
      )}
    >
      {/* Checkbox */}
      <div className="pt-0.5" onClick={handleToggle} onKeyDown={(e) => e.stopPropagation()}>
        <Checkbox
          checked={task.is_completed}
          aria-label={`Marquer "${task.title}" comme ${task.is_completed ? "non complétée" : "complétée"}`}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium leading-tight",
              task.is_completed && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Code task badge */}
          {task.is_code_task && (
            <Badge variant="outline" className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] px-1.5 py-0">
              <Code className="size-3" />
              Code
            </Badge>
          )}

          {/* Urgency badge */}
          {urgencyConfig && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
              style={{
                borderColor: `${urgencyConfig.color}50`,
                backgroundColor: `${urgencyConfig.color}15`,
                color: urgencyConfig.color,
              }}
            >
              {urgencyConfig.label}
            </Badge>
          )}

          {/* Tags */}
          {task.tags?.map((tag) => (
            <TagBadge key={tag.id} tag={tag} size="sm" />
          ))}

          {/* Due date */}
          {task.due_date && !task.is_completed && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium"
              style={{ color: dueStatusColor }}
            >
              <Calendar className="size-3" />
              {formatDueDate(task.due_date)}
            </span>
          )}

          {/* Project */}
          {task.project_name && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: task.project_color ?? "#64748b" }}
              />
              {task.project_name}
            </span>
          )}

          {/* Estimated duration */}
          {task.estimated_minutes && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="size-3" />
              {formatEstimation(task.estimated_minutes)}
            </span>
          )}

          {/* Subtask counter */}
          {hasSubtasks && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <ListTree className="size-3" />
              {task.subtask_completed_count ?? 0}/{task.subtask_count}
            </span>
          )}
        </div>
      </div>

      {/* Context menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            aria-label="Actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onEdit?.(task)}>
            <Pencil className="mr-2 size-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSchedule?.(task)}>
            <Calendar className="mr-2 size-4" />
            Planifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddSubtask?.(task)}>
            <Plus className="mr-2 size-4" />
            Sous-tâche
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete?.(task)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
