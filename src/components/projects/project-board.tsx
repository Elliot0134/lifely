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
} from '@dnd-kit/core'

import type { Project } from '@/types/tasks'
import type { ProjectGroupBy, ProjectGroup, ProjectSubGroup } from '@/hooks/use-projects-view'

import { Skeleton } from '@/components/ui/skeleton'
import { ProjectBoardColumn } from '@/components/projects/project-board-column'
import { ProjectBoardCard } from '@/components/projects/project-board-card'

// ─── Props ──────────────────────────────────────────────

interface ProjectBoardProps {
  groupedProjects: Map<string, ProjectGroup>
  groupBy: ProjectGroupBy
  onSelectProject: (project: Project) => void
  onMoveProject: (projectId: string, targetColumnKey: string) => void
  onCreateProject: () => void
  showCompleted: boolean
}

// ─── Component ──────────────────────────────────────────

export function ProjectBoard({
  groupedProjects,
  groupBy,
  onSelectProject,
  onMoveProject,
  onCreateProject,
  showCompleted,
}: ProjectBoardProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const findProject = useCallback(
    (id: string): Project | undefined => {
      for (const group of groupedProjects.values()) {
        const found = group.projects.find((p) => p.id === id)
        if (found) return found
      }
      return undefined
    },
    [groupedProjects]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const project = findProject(event.active.id as string)
      if (project) setActiveProject(project)
    },
    [findProject]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveProject(null)

      const { active, over } = event
      if (!over || active.id === over.id) return

      const projectId = active.id as string
      let targetColumnKey: string | null = null

      // Check if dropped on a column
      for (const [key] of groupedProjects.entries()) {
        if (over.id === `column-${key}`) {
          targetColumnKey = key
          break
        }
      }

      // If dropped on a project card, find its column
      if (!targetColumnKey) {
        for (const [key, group] of groupedProjects.entries()) {
          if (group.projects.some((p) => p.id === over.id)) {
            targetColumnKey = key
            break
          }
        }
      }

      if (!targetColumnKey) return

      // Check project isn't already in this column
      const currentColumn = Array.from(groupedProjects.entries()).find(([, group]) =>
        group.projects.some((p) => p.id === projectId)
      )
      if (currentColumn && currentColumn[0] === targetColumnKey) return

      onMoveProject(projectId, targetColumnKey)
    },
    [groupedProjects, onMoveProject]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from(groupedProjects.entries()).map(([key, group]) => (
          <div
            key={key}
            className="w-[300px] shrink-0 md:min-w-[280px] md:max-w-[400px] md:flex-1 md:w-auto"
          >
            <ProjectBoardColumn
              groupKey={key}
              label={group.label}
              color={group.color}
              projects={group.projects}
              subGroups={group.subGroups}
              groupBy={groupBy}
              onSelectProject={onSelectProject}
              onCreateProject={onCreateProject}
              showCompleted={showCompleted}
            />
          </div>
        ))}
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeProject ? (
          <div className="w-[280px] rotate-2 opacity-90">
            <ProjectBoardCard
              project={activeProject}
              className="shadow-lg ring-2 ring-primary/20"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// ─── Skeleton ───────────────────────────────────────────

export function ProjectBoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 3 }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="w-[300px] shrink-0 md:min-w-[280px] md:max-w-[400px] md:flex-1 md:w-auto"
        >
          <div className="flex flex-col rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-5 w-6 rounded-full" />
            </div>
            <div className="flex flex-col gap-2 p-2">
              {Array.from({ length: 2 - (colIdx > 1 ? 1 : 0) }).map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="rounded-lg border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-2.5 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
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
