"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { AlertTriangle, Calendar, Code, Flame, ListTree } from "lucide-react"

import { cn } from "@/lib/utils"
import { TASK_DUE_STATUS_COLORS } from "@/lib/constants"
import type { Task, TaskDueStatus, TaskStatus } from "@/types/tasks"

import { TagBadge } from "@/components/tags/tag-badge"
import { TaskStatusCheckbox } from "@/components/tasks/task-status-checkbox"

// ─── Props ──────────────────────────────────────────────

interface TaskBoardCardProps {
  task: Task
  onSelect: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  hideProject?: boolean
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

// ─── Component ──────────────────────────────────────────

export function TaskBoardCard({
  task,
  onSelect,
  onStatusChange,
  hideProject = false,
  className,
}: TaskBoardCardProps) {
  const isCompleted = task.status === "completed"
  const hasSubtasks = (task.subtask_count ?? 0) > 0

  const dueStatusColor = task.due_status
    ? TASK_DUE_STATUS_COLORS[task.due_status as TaskDueStatus]
    : undefined

  const visibleTags = task.tags?.slice(0, 2) ?? []
  const extraTagCount = (task.tags?.length ?? 0) - visibleTags.length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(task)
        }
      }}
      className={cn(
        "rounded-lg border bg-card p-3 transition-shadow cursor-pointer",
        "hover:shadow-sm",
        isCompleted && "opacity-60",
        className
      )}
    >
      {/* Row 1: Checkbox + Title */}
      <div className="flex items-start gap-2">
        <div
          className="shrink-0 pt-0.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <TaskStatusCheckbox
            status={task.status}
            onChange={(newStatus) => onStatusChange(task.id, newStatus)}
            size="sm"
          />
        </div>
        <span
          className={cn(
            "flex-1 truncate text-sm font-medium leading-tight",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </span>
      </div>

      {/* Row 2: Metadata */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {/* Project badge */}
        {!hideProject && task.project_name && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: task.project_color ?? "#64748b" }}
            />
            {task.project_name}
          </span>
        )}

        {/* Icon-only badges */}
        {task.is_urgent && (
          <Flame className="size-3.5 text-destructive shrink-0" />
        )}
        {task.is_important && (
          <AlertTriangle className="size-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
        )}
        {task.is_code_task && (
          <Code className="size-3.5 text-muted-foreground shrink-0" />
        )}

        {/* Due date */}
        {task.due_date && !isCompleted && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium"
            style={{ color: dueStatusColor }}
          >
            <Calendar className="size-3" />
            {formatDueDate(task.due_date)}
          </span>
        )}

        {/* Subtask counter */}
        {hasSubtasks && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <ListTree className="size-3" />
            {task.subtask_completed_count ?? 0}/{task.subtask_count}
          </span>
        )}

        {/* Tags (max 2 + overflow) */}
        {visibleTags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} size="sm" />
        ))}
        {extraTagCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            +{extraTagCount}
          </span>
        )}
      </div>
    </div>
  )
}
