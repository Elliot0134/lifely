'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'

import type { Task, TaskStatus } from '@/types/tasks'
import type { GroupBy, TaskSubGroup } from '@/hooks/use-tasks-view'

import { Skeleton } from '@/components/ui/skeleton'
import { TaskBoardColumn } from '@/components/tasks/task-board-column'
import { TaskBoardCard } from '@/components/tasks/task-board-card'

// ─── Props ──────────────────────────────────────────────

interface TaskBoardProps {
  groupedTasks: Map<string, { label: string; color: string; tasks: Task[]; subGroups?: Map<string, TaskSubGroup> }>
  groupBy: GroupBy
  onSelectTask: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onMoveTask: (taskId: string, targetColumnKey: string) => void
  onCreateTask: (defaultProjectId?: string) => void
  showCompleted: boolean
}

// ─── Component ──────────────────────────────────────────

export function TaskBoard({
  groupedTasks,
  groupBy,
  onSelectTask,
  onStatusChange,
  onMoveTask,
  onCreateTask,
  showCompleted,
}: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // Find a task by ID across all groups
  const findTask = useCallback(
    (id: string): Task | undefined => {
      for (const group of groupedTasks.values()) {
        const found = group.tasks.find((t) => t.id === id)
        if (found) return found
      }
      return undefined
    },
    [groupedTasks]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = findTask(event.active.id as string)
      if (task) setActiveTask(task)
    },
    [findTask]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null)

      const { active, over } = event
      if (!over || active.id === over.id) return

      const taskId = active.id as string

      // Determine target column: over can be a column ID or a task ID
      let targetColumnKey: string | null = null

      // Check if dropped on a column directly
      for (const [key] of groupedTasks.entries()) {
        if (over.id === `column-${key}`) {
          targetColumnKey = key
          break
        }
      }

      // If dropped on a task, find which column that task belongs to
      if (!targetColumnKey) {
        for (const [key, group] of groupedTasks.entries()) {
          if (group.tasks.some((t) => t.id === over.id)) {
            targetColumnKey = key
            break
          }
        }
      }

      if (!targetColumnKey) return

      // Check task isn't already in this column
      const currentColumn = Array.from(groupedTasks.entries()).find(([, group]) =>
        group.tasks.some((t) => t.id === taskId)
      )
      if (currentColumn && currentColumn[0] === targetColumnKey) return

      onMoveTask(taskId, targetColumnKey)
    },
    [groupedTasks, onMoveTask]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
              subGroups={group.subGroups}
              groupBy={groupBy}
              onSelectTask={onSelectTask}
              onStatusChange={onStatusChange}
              onCreateTask={onCreateTask}
              showCompleted={showCompleted}
            />
          </div>
        ))}
      </div>

      {/* Drag overlay — renders the card being dragged */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-[260px] rotate-2 opacity-90">
            <TaskBoardCard
              task={activeTask}
              onSelect={() => {}}
              onStatusChange={() => {}}
              className="shadow-lg ring-2 ring-primary/20"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
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
            <div className="flex items-center gap-2 px-3 py-2.5 border-b">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-5 w-6 rounded-full" />
            </div>
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
            <div className="border-t p-2">
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
