'use client'

import type { Task, TaskStatus } from '@/types/tasks'
import type { GroupBy } from '@/hooks/use-tasks-view'

import { Skeleton } from '@/components/ui/skeleton'
import { TaskBoardColumn } from '@/components/tasks/task-board-column'

// ─── Props ──────────────────────────────────────────────

interface TaskBoardProps {
  groupedTasks: Map<string, { label: string; color: string; tasks: Task[] }>
  groupBy: GroupBy
  onSelectTask: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  showCompleted: boolean
}

// ─── Component ──────────────────────────────────────────

export function TaskBoard({
  groupedTasks,
  groupBy,
  onSelectTask,
  onStatusChange,
  showCompleted,
}: TaskBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from(groupedTasks.entries()).map(([key, group]) => (
        <div
          key={key}
          className="w-[280px] shrink-0 md:min-w-[250px] md:max-w-[350px] md:flex-1 md:w-auto"
        >
          <TaskBoardColumn
            groupKey={key}
            label={group.label}
            color={group.color}
            tasks={group.tasks}
            groupBy={groupBy}
            onSelectTask={onSelectTask}
            onStatusChange={onStatusChange}
            showCompleted={showCompleted}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────

export function TaskBoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 3 }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="w-[280px] shrink-0 md:min-w-[250px] md:max-w-[350px] md:flex-1 md:w-auto"
        >
          <div className="flex flex-col rounded-lg border bg-muted/30">
            {/* Header skeleton */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-5 w-6 rounded-full" />
            </div>

            {/* Cards skeleton */}
            <div className="flex flex-col gap-2 p-2">
              {Array.from({ length: 3 - colIdx }).map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="rounded-lg border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick-add skeleton */}
            <div className="border-t p-2">
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
