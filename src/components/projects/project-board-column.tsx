'use client'

import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Project } from '@/types/tasks'
import type { ProjectGroupBy, ProjectSubGroup } from '@/hooks/use-projects-view'

import { Badge } from '@/components/ui/badge'
import { ProjectBoardCard } from '@/components/projects/project-board-card'
import { DraggableProjectCard } from '@/components/projects/draggable-project-card'

// ─── Props ──────────────────────────────────────────────

interface ProjectBoardColumnProps {
  groupKey: string
  label: string
  color: string
  projects: Project[]
  subGroups?: Map<string, ProjectSubGroup>
  groupBy: ProjectGroupBy
  onSelectProject: (project: Project) => void
  onCreateProject: () => void
  showCompleted: boolean
}

// ─── Component ──────────────────────────────────────────

export function ProjectBoardColumn({
  groupKey,
  label,
  color,
  projects,
  subGroups,
  groupBy,
  onSelectProject,
  onCreateProject,
  showCompleted,
}: ProjectBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${groupKey}`,
  })

  const visibleProjects = showCompleted
    ? projects
    : projects.filter((p) => p.status !== 'completed')

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
          {visibleProjects.length}
        </Badge>
      </div>

      {/* Card list */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 overflow-y-auto p-2 min-h-[60px]',
          'max-h-[calc(100vh-250px)]'
        )}
      >
        {visibleProjects.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {isOver ? 'Déposer ici' : 'Aucun projet'}
          </p>
        ) : hasSubGroups ? (
          // Render with sub-group sections
          Array.from(subGroups.entries()).map(([subKey, subGroup]) => {
            const subProjects = showCompleted
              ? subGroup.projects
              : subGroup.projects.filter((p) => p.status !== 'completed')
            if (subProjects.length === 0) return null

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
                    {subProjects.length}
                  </span>
                </div>
                {subProjects.map((project) => (
                  <div key={project.id} className="mb-2">
                    <DraggableProjectCard
                      project={project}
                      onSelect={onSelectProject}
                      hideStatus={groupBy === 'status'}
                      hideCompany={groupBy === 'company'}
                    />
                  </div>
                ))}
              </div>
            )
          })
        ) : (
          // Flat list
          visibleProjects.map((project) => (
            <DraggableProjectCard
              key={project.id}
              project={project}
              onSelect={onSelectProject}
              hideStatus={groupBy === 'status'}
              hideCompany={groupBy === 'company'}
            />
          ))
        )}
      </div>

      {/* Create button */}
      <div className="border-t p-2">
        <button
          type="button"
          onClick={onCreateProject}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-1.5',
            'text-sm text-muted-foreground cursor-pointer',
            'transition-colors hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Plus className="size-4" />
          Nouveau projet
        </button>
      </div>
    </div>
  )
}
