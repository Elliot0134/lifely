"use client"

import { Clock, Code } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Task } from "@/types/tasks"

import { Badge } from "@/components/ui/badge"

// ─── Props ──────────────────────────────────────────────

interface TaskTimeBlockProps {
  task: Task
  onClick?: () => void
  /** Height in pixels, calculated by parent based on duration */
  style?: React.CSSProperties
  className?: string
}

// ─── Helpers ────────────────────────────────────────────

function formatEstimation(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`
}

function formatTimeRange(start: string | null, end: string | null): string {
  if (!start || !end) return ""
  return `${start.slice(0, 5)} - ${end.slice(0, 5)}`
}

// ─── Component ──────────────────────────────────────────

export function TaskTimeBlock({
  task,
  onClick,
  style,
  className,
}: TaskTimeBlockProps) {
  const isCode = task.is_code_task

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border px-3 py-2 text-left transition-all",
        "hover:ring-2 hover:ring-ring/20 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isCode
          ? "border-blue-500/30 bg-blue-500/10 text-blue-950 dark:text-blue-100"
          : "border-slate-500/30 bg-slate-500/10 text-slate-950 dark:text-slate-100",
        task.status === "completed" && "opacity-50",
        className
      )}
      style={style}
      aria-label={`Tâche : ${task.title}`}
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1 space-y-1">
          {/* Title */}
          <p
            className={cn(
              "text-sm font-medium leading-tight truncate",
              task.status === "completed" && "line-through"
            )}
          >
            {task.title}
          </p>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Time range */}
            {task.scheduled_start_time && task.scheduled_end_time && (
              <span className="text-[10px] font-medium opacity-70">
                {formatTimeRange(
                  task.scheduled_start_time,
                  task.scheduled_end_time
                )}
              </span>
            )}

            {/* Code badge */}
            {isCode && (
              <Badge
                variant="outline"
                className="gap-0.5 border-blue-500/40 bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px] px-1 py-0"
              >
                <Code className="size-2.5" />
                Code
              </Badge>
            )}

            {/* Urgency */}
            {task.is_urgent && (
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 border-red-500/50 bg-red-500/15 text-red-600 dark:text-red-400"
              >
                Urgent
              </Badge>
            )}
            {task.is_important && (
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-400"
              >
                Important
              </Badge>
            )}

            {/* Estimation */}
            {task.estimated_minutes && (
              <span className="inline-flex items-center gap-0.5 text-[10px] opacity-60">
                <Clock className="size-2.5" />
                {formatEstimation(task.estimated_minutes)}
              </span>
            )}
          </div>
        </div>

        {/* Project color dot */}
        {task.project_name && (
          <span
            className="mt-1 size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: task.project_color ?? "#64748b" }}
            title={task.project_name}
          />
        )}
      </div>
    </button>
  )
}
