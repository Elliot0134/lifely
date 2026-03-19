'use client'

import { useState, useCallback, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'
import { useCreateTask } from '@/lib/queries/tasks'
import type { Task, TaskStatus, CreateTaskInput } from '@/types/tasks'
import type { GroupBy } from '@/hooks/use-tasks-view'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { TaskBoardCard } from '@/components/tasks/task-board-card'

// ─── Props ──────────────────────────────────────────────

interface TaskBoardColumnProps {
  groupKey: string
  label: string
  color: string
  tasks: Task[]
  groupBy: GroupBy
  onSelectTask: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  showCompleted: boolean
}

// ─── Component ──────────────────────────────────────────

export function TaskBoardColumn({
  groupKey,
  label,
  color,
  tasks,
  groupBy,
  onSelectTask,
  onStatusChange,
  showCompleted,
}: TaskBoardColumnProps) {
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const { mutate: createTask, isPending } = useCreateTask()

  // Filter out completed tasks if needed
  const visibleTasks = showCompleted
    ? tasks
    : tasks.filter((t) => t.status !== 'completed')

  // Build pre-filled input based on groupBy
  const buildCreateInput = useCallback(
    (title: string): CreateTaskInput => {
      const input: CreateTaskInput = { title }

      switch (groupBy) {
        case 'project':
          if (groupKey !== 'no_project') {
            input.project_id = groupKey
          }
          break
        case 'status':
          // status is set server-side on creation; we pass it as-is
          // CreateTaskInput doesn't have status, but we can handle it
          // by setting default — status defaults to 'todo' anyway
          break
        case 'urgency':
          if (groupKey === 'urgent_important') {
            input.is_urgent = true
            input.is_important = true
          } else if (groupKey === 'urgent') {
            input.is_urgent = true
          } else if (groupKey === 'important') {
            input.is_important = true
          }
          break
        // company, none, due_status: no pre-fill possible
        default:
          break
      }

      return input
    },
    [groupBy, groupKey]
  )

  const handleQuickAdd = useCallback(() => {
    const trimmed = quickAddTitle.trim()
    if (!trimmed) return

    const input = buildCreateInput(trimmed)
    createTask(input)
    setQuickAddTitle('')
  }, [quickAddTitle, buildCreateInput, createTask])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleQuickAdd()
      }
    },
    [handleQuickAdd]
  )

  return (
    <div className="flex flex-col rounded-lg border bg-muted/30">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="flex-1 truncate text-sm font-medium">{label}</span>
        <Badge variant="secondary" className="text-xs tabular-nums">
          {visibleTasks.length}
        </Badge>
      </div>

      {/* Card list */}
      <div
        className={cn(
          'flex flex-col gap-2 overflow-y-auto p-2',
          'max-h-[calc(100vh-250px)]'
        )}
      >
        {visibleTasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune tâche
          </p>
        ) : (
          visibleTasks.map((task) => (
            <TaskBoardCard
              key={task.id}
              task={task}
              onSelect={onSelectTask}
              onStatusChange={onStatusChange}
              hideProject={groupBy === 'project'}
            />
          ))
        )}
      </div>

      {/* Quick-add */}
      <div className="border-t p-2">
        <Input
          placeholder="+ Nouvelle tâche"
          value={quickAddTitle}
          onChange={(e) => setQuickAddTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          className="h-8 text-sm bg-transparent border-dashed"
        />
      </div>
    </div>
  )
}
