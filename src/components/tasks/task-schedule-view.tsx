"use client"

import { useMemo } from "react"
import { Clock, Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { useScheduledTasks, useTasks } from "@/lib/queries/tasks"
import type { Task } from "@/types/tasks"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { TaskTimeBlock } from "@/components/tasks/task-time-block"
import { useUpdateTaskStatus } from "@/lib/queries/tasks"

// ─── Props ──────────────────────────────────────────────

interface TaskScheduleViewProps {
  date: string // YYYY-MM-DD
  onTaskSelect?: (task: Task) => void
}

// ─── Constants ──────────────────────────────────────────

const SCHEDULE_START_HOUR = 8
const SCHEDULE_END_HOUR = 20
const HOUR_HEIGHT_PX = 72 // px per hour slot
const HOURS = Array.from(
  { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR },
  (_, i) => SCHEDULE_START_HOUR + i
)

// ─── Helpers ────────────────────────────────────────────

/** Convert "HH:MM" or "HH:MM:SS" to fractional hours */
function timeToHours(time: string): number {
  const parts = time.split(":")
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1] ?? "0", 10)
  return h + m / 60
}

/** Calculate top offset and height for a scheduled task */
function getBlockPosition(task: Task): {
  top: number
  height: number
} | null {
  if (!task.scheduled_start_time || !task.scheduled_end_time) return null

  const startHours = timeToHours(task.scheduled_start_time)
  const endHours = timeToHours(task.scheduled_end_time)

  // Clamp to schedule bounds
  const clampedStart = Math.max(startHours, SCHEDULE_START_HOUR)
  const clampedEnd = Math.min(endHours, SCHEDULE_END_HOUR)

  if (clampedStart >= clampedEnd) return null

  const top = (clampedStart - SCHEDULE_START_HOUR) * HOUR_HEIGHT_PX
  const height = (clampedEnd - clampedStart) * HOUR_HEIGHT_PX

  return { top, height: Math.max(height, 36) } // min 36px for readability
}

// ─── Simple inline task item for schedule lists ─────────

function ScheduleTaskItem({
  task,
  onSelect,
}: {
  task: Task
  onSelect?: (task: Task) => void
}) {
  const updateStatus = useUpdateTaskStatus()
  const toggleCompleted = () => {
    updateStatus.mutate({
      id: task.id,
      status: task.status === "completed" ? "todo" : "completed",
    })
  }
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
        "flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50 cursor-pointer",
        task.status === "completed" && "opacity-60"
      )}
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
          toggleCompleted()
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={task.status === "completed"}
          aria-label={`Marquer "${task.title}" comme ${task.status === "completed" ? "non completee" : "completee"}`}
        />
      </div>
      <span
        className={cn(
          "flex-1 text-sm font-medium truncate",
          task.status === "completed" && "line-through text-muted-foreground"
        )}
      >
        {task.title}
      </span>
      {task.project_name && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 hidden sm:inline-flex">
          <span
            className="h-1.5 w-1.5 rounded-full mr-1"
            style={{ backgroundColor: task.project_color ?? "#64748b" }}
          />
          {task.project_name}
        </Badge>
      )}
    </div>
  )
}

// ─── Component ──────────────────────────────────────────

export function TaskScheduleView({ date, onTaskSelect }: TaskScheduleViewProps) {
  // Scheduled tasks for this date
  const {
    data: scheduledTasks,
    isLoading: loadingScheduled,
  } = useScheduledTasks(date)

  // Unscheduled incomplete tasks (no scheduled_date)
  const {
    data: allUnscheduledTasks,
    isLoading: loadingUnscheduled,
  } = useTasks({ parent_task_id: null })

  // Filter unscheduled: tasks without a scheduled_date
  const unscheduledTasks = useMemo(
    () =>
      (allUnscheduledTasks ?? []).filter(
        (t) => !t.scheduled_date && t.status !== "completed"
      ),
    [allUnscheduledTasks]
  )

  // Split scheduled into positioned (with times) and date-only
  const { positioned, dateOnly } = useMemo(() => {
    const pos: (Task & { _position: { top: number; height: number } })[] = []
    const dateOnlyList: Task[] = []

    for (const task of scheduledTasks ?? []) {
      const position = getBlockPosition(task)
      if (position) {
        pos.push({ ...task, _position: position })
      } else {
        dateOnlyList.push(task)
      }
    }

    return { positioned: pos, dateOnly: dateOnlyList }
  }, [scheduledTasks])

  const totalHeight = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * HOUR_HEIGHT_PX

  return (
    <div className="space-y-6">
      {/* ─── Timeline ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4" />
            Planning du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingScheduled ? (
            <ScheduleSkeleton />
          ) : (
            <div className="relative overflow-hidden">
              {/* Hour grid */}
              <div
                className="relative"
                style={{ height: totalHeight }}
              >
                {HOURS.map((hour) => {
                  const top =
                    (hour - SCHEDULE_START_HOUR) * HOUR_HEIGHT_PX
                  return (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 flex"
                      style={{ top }}
                    >
                      {/* Hour label */}
                      <div className="w-14 shrink-0 pr-3 text-right">
                        <span className="text-xs font-medium text-muted-foreground -translate-y-1/2 block">
                          {hour.toString().padStart(2, "0")}:00
                        </span>
                      </div>
                      {/* Grid line */}
                      <div className="flex-1 border-t border-border/50" />
                    </div>
                  )
                })}

                {/* Closing line */}
                <div
                  className="absolute left-0 right-0 flex"
                  style={{ top: totalHeight }}
                >
                  <div className="w-14 shrink-0 pr-3 text-right">
                    <span className="text-xs font-medium text-muted-foreground -translate-y-1/2 block">
                      {SCHEDULE_END_HOUR}:00
                    </span>
                  </div>
                  <div className="flex-1 border-t border-border/50" />
                </div>

                {/* Positioned task blocks */}
                {positioned.map((task) => (
                  <div
                    key={task.id}
                    className="absolute left-14 right-2"
                    style={{
                      top: task._position.top + 2,
                      height: task._position.height - 4,
                    }}
                  >
                    <TaskTimeBlock
                      task={task}
                      onClick={() => onTaskSelect?.(task)}
                      className="h-full"
                    />
                  </div>
                ))}

                {/* Empty state */}
                {positioned.length === 0 && dateOnly.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Aucune tâche planifiée pour cette journée
                    </p>
                  </div>
                )}
              </div>

              {/* Date-only scheduled tasks (no specific time) */}
              {dateOnly.length > 0 && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Planifiées ce jour (sans horaire)
                  </h4>
                  <div className="space-y-1.5">
                    {dateOnly.map((task) => (
                      <ScheduleTaskItem
                        key={task.id}
                        task={task}
                        onSelect={onTaskSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Unscheduled tasks ─────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="size-4" />
            Tâches non planifiées
            {!loadingUnscheduled && (
              <span className="text-xs font-normal text-muted-foreground">
                ({unscheduledTasks.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUnscheduled ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : unscheduledTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Toutes les tâches sont planifiées !
            </p>
          ) : (
            <div className="space-y-1.5">
              {unscheduledTasks.map((task) => (
                <ScheduleTaskItem
                  key={task.id}
                  task={task}
                  onSelect={onTaskSelect}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────

function ScheduleSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-[68px] flex-1 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
