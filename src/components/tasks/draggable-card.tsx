'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'

import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/tasks'

import { TaskBoardCard } from '@/components/tasks/task-board-card'

// ─── Props ──────────────────────────────────────────────

interface DraggableCardProps {
  task: Task
  onSelect: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  hideProject?: boolean
}

// ─── Component ──────────────────────────────────────────

/**
 * Kanban card that can be dragged to another column. The task id doubles as
 * the droppable id so a drop on a card resolves to that card's column
 * (see `handleDragEnd` in task-board.tsx).
 */
export function DraggableCard({
  task,
  onSelect,
  onStatusChange,
  hideProject,
}: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: task.id })
  const { setNodeRef: setDropRef } = useDroppable({ id: task.id })

  return (
    <div
      ref={(node) => {
        setDragRef(node)
        setDropRef(node)
      }}
      {...attributes}
      {...listeners}
      className={cn('md:touch-none', isDragging && 'opacity-40')}
    >
      <TaskBoardCard
        task={task}
        onSelect={onSelect}
        onStatusChange={onStatusChange}
        hideProject={hideProject}
      />
    </div>
  )
}
