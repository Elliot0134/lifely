'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/tasks'
import { ProjectBoardCard } from '@/components/projects/project-board-card'

interface DraggableProjectCardProps {
  project: Project
  onSelect?: (project: Project) => void
  hideStatus?: boolean
  hideCompany?: boolean
}

export function DraggableProjectCard({
  project,
  onSelect,
  hideStatus,
  hideCompany,
}: DraggableProjectCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: project.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'touch-none',
        isDragging && 'opacity-30'
      )}
    >
      <ProjectBoardCard
        project={project}
        onSelect={onSelect}
        hideStatus={hideStatus}
        hideCompany={hideCompany}
      />
    </div>
  )
}
