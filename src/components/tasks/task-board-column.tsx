'use client'

import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/tasks'
import type { GroupBy, TaskSubGroup } from '@/hooks/use-tasks-view'

import { Badge } from '@/components/ui/badge'
import { DraggableCard } from '@/components/tasks/draggable-card'

// ─── Props ──────────────────────────────────────────────

interface TaskBoardColumnProps {
  groupKey: string
  label: string
  color: string
  tasks: Task[]
  subGroups?: Map<string, TaskSubGroup>
  groupBy: GroupBy
  onSelectTask: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onCreateTask: (defaultProjectId?: string) => void
  showCompleted: boolean
}

// ─── Component ──────────────────────────────────────────

export function TaskBoardColumn({
  groupKey,
  label,
  color,
  tasks,
  subGroups,
  groupBy,
  onSelectTask,
  onStatusChange,
  onCreateTask,
  showCompleted,
}: TaskBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${groupKey}`,
  })

  const visibleTasks = showCompleted
    ? tasks
    : tasks.filter((t) => t.status !== 'completed')

  const handleCreateClick = () => {
    const defaultProjectId =
      groupBy === 'project' && groupKey !== 'no_project'
        ? groupKey
        : undefined
    onCreateTask(defaultProjectId)
  }

  const hasSubGroups = subGroups && subGroups.size > 0

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border bg-muted/30 transition-colors',
        isOver && 'ring-2 ring-primary/30 bg-primary/5'
      )}
    >
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

      {/* Card list — droppable zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 overflow-y-auto p-2 min-h-[60px]',
          'max-h-[calc(100vh-250px)]'
        )}
      >
        {visibleTasks.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {isOver ? 'Déposer ici' : 'Aucune tâche'}
          </p>
        ) : hasSubGroups ? (
          // Render with sub-group sections
          Array.from(subGroups.entries()).map(([subKey, subGroup]) => {
            const subTasks = showCompleted
              ? subGroup.tasks
              : subGroup.tasks.filter((t) => t.status !== 'completed')
            if (subTasks.length === 0) return null

            return (
              <div key={subKey}>
                {/* Sub-group header */}
                <div className="flex items-center gap-1.5 px-1 py-1">
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: subGroup.color }}
                  />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {subGroup.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {subTasks.length}
                  </span>
                </div>
                {subTasks.map((task) => (
                  <div key={task.id} className="mb-2">
                    <DraggableCard
                      task={task}
                      onSelect={onSelectTask}
                      onStatusChange={onStatusChange}
                      hideProject={groupBy === 'project'}
                    />
                  </div>
                ))}
              </div>
            )
          })
        ) : (
          // Flat list
          visibleTasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              onSelect={onSelectTask}
              onStatusChange={onStatusChange}
              hideProject={groupBy === 'project'}
            />
          ))
        )}
      </div>

      {/* Create task button */}
      <div className="border-t p-2">
        <button
          type="button"
          onClick={handleCreateClick}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-1.5',
            'text-sm text-muted-foreground cursor-pointer',
            'transition-colors hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Plus className="size-4" />
          Nouvelle tâche
        </button>
      </div>
    </div>
  )
}
