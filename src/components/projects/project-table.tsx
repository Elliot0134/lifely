'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  ListChecks,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { PROJECT_STATUSES } from '@/lib/constants'
import type { Project } from '@/types/tasks'
import type { ProjectGroupBy, ProjectSortBy, ProjectGroup } from '@/hooks/use-projects-view'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ──────────────────────────────────────────────

interface ProjectTableProps {
  groupedProjects: Map<string, ProjectGroup>
  groupBy: ProjectGroupBy
  onSelectProject: (project: Project) => void
  showCompleted: boolean
  sortBy: ProjectSortBy
  sortOrder: 'asc' | 'desc'
  onSortChange: (column: ProjectSortBy) => void
}

// ─── Column config ──────────────────────────────────────

interface Column {
  key: ProjectSortBy | 'status_badge' | 'company' | 'tasks'
  label: string
  sortable: boolean
  sortKey?: ProjectSortBy
  className: string
}

const COLUMNS: Column[] = [
  {
    key: 'name',
    label: 'Projet',
    sortable: true,
    sortKey: 'name',
    className: 'flex-1 min-w-0',
  },
  {
    key: 'status_badge',
    label: 'Statut',
    sortable: false,
    className: 'w-28 hidden sm:flex',
  },
  {
    key: 'company',
    label: 'Entreprise',
    sortable: false,
    className: 'w-32 hidden md:flex',
  },
  {
    key: 'tasks',
    label: 'Tâches',
    sortable: false,
    className: 'w-20',
  },
  {
    key: 'progress',
    label: 'Progression',
    sortable: true,
    sortKey: 'progress',
    className: 'w-28 hidden sm:flex',
  },
  {
    key: 'end_date',
    label: 'Échéance',
    sortable: true,
    sortKey: 'end_date',
    className: 'w-24 text-right hidden sm:flex',
  },
]

// ─── Helpers ────────────────────────────────────────────

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

// ─── Sort header ────────────────────────────────────────

function SortIcon({
  column,
  currentSort,
  sortOrder,
}: {
  column: Column
  currentSort: ProjectSortBy
  sortOrder: 'asc' | 'desc'
}) {
  if (!column.sortable || !column.sortKey) return null

  if (column.sortKey !== currentSort) {
    return <ChevronsUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
  }

  return sortOrder === 'asc' ? (
    <ChevronUp className="ml-1 h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3" />
  )
}

// ─── Table row ──────────────────────────────────────────

function ProjectRow({ project, onSelect }: { project: Project; onSelect: (p: Project) => void }) {
  const isCompleted = project.status === 'completed'
  const statusConfig = PROJECT_STATUSES.find((s) => s.value === project.status) ?? PROJECT_STATUSES[0]
  const taskCount = project.task_count ?? 0
  const completedCount = project.completed_task_count ?? 0
  const progress = project.progress ?? 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(project)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(project)
        }
      }}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 border-b border-border/50 cursor-pointer',
        'transition-colors hover:bg-accent/50',
        isCompleted && 'opacity-50'
      )}
    >
      {/* Name */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {project.color && (
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: project.color }}
          />
        )}
        <span
          className={cn(
            'text-sm font-medium truncate',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {project.name}
        </span>
      </div>

      {/* Status */}
      <div className="w-28 hidden sm:flex items-center shrink-0">
        <Badge
          variant="outline"
          className="px-1.5 py-0 text-[10px] gap-1"
          style={{
            borderColor: statusConfig.color,
            color: statusConfig.color,
          }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: statusConfig.color }}
          />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Company */}
      <div className="w-32 hidden md:flex items-center shrink-0">
        {project.company ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            {project.company.color && (
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: project.company.color }}
              />
            )}
            {project.company.name}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">-</span>
        )}
      </div>

      {/* Tasks */}
      <div className="w-20 shrink-0">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ListChecks className="size-3.5" />
          {completedCount}/{taskCount}
        </span>
      </div>

      {/* Progress */}
      <div className="w-28 hidden sm:flex items-center gap-2 shrink-0">
        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              progress === 100
                ? 'bg-[hsl(142,76%,36%)]'
                : progress > 0
                  ? 'bg-[hsl(45,93%,47%)]'
                  : 'bg-muted-foreground/20'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-right">
          {progress}%
        </span>
      </div>

      {/* End date */}
      <div className="w-24 text-right hidden sm:flex items-center justify-end shrink-0">
        {project.end_date ? (
          <span className="text-xs text-muted-foreground">
            {formatDate(project.end_date)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">-</span>
        )}
      </div>
    </div>
  )
}

// ─── Group section ──────────────────────────────────────

function GroupSection({
  group,
  onSelectProject,
  showCompleted,
}: {
  group: ProjectGroup
  onSelectProject: (project: Project) => void
  showCompleted: boolean
}) {
  const [isOpen, setIsOpen] = useState(true)
  const filteredProjects = showCompleted
    ? group.projects
    : group.projects.filter((p) => p.status !== 'completed')

  if (filteredProjects.length === 0) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2',
          'bg-muted/50 hover:bg-muted transition-colors',
          'text-sm font-medium'
        )}
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: group.color }}
        />
        <span>{group.label}</span>
        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
          {filteredProjects.length}
        </Badge>
      </button>

      {isOpen && (
        <div>
          {filteredProjects.map((project) => (
            <ProjectRow key={project.id} project={project} onSelect={onSelectProject} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────

export function ProjectTable({
  groupedProjects,
  groupBy,
  onSelectProject,
  showCompleted,
  sortBy,
  sortOrder,
  onSortChange,
}: ProjectTableProps) {
  const isGrouped = groupBy !== 'none'

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/30 text-xs text-muted-foreground font-medium">
        {COLUMNS.map((col) => {
          const isSorted = col.sortable && col.sortKey === sortBy

          return (
            <div
              key={col.key}
              className={cn(
                col.className,
                col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                isSorted && 'text-foreground'
              )}
              onClick={
                col.sortable && col.sortKey
                  ? () => onSortChange(col.sortKey!)
                  : undefined
              }
              role={col.sortable ? 'button' : undefined}
              tabIndex={col.sortable ? 0 : undefined}
              onKeyDown={
                col.sortable && col.sortKey
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSortChange(col.sortKey!)
                      }
                    }
                  : undefined
              }
            >
              <span className="inline-flex items-center">
                {col.label}
                <SortIcon
                  column={col}
                  currentSort={sortBy}
                  sortOrder={sortOrder}
                />
              </span>
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div>
        {isGrouped ? (
          Array.from(groupedProjects.entries()).map(([key, group]) => (
            <GroupSection
              key={key}
              group={group}
              onSelectProject={onSelectProject}
              showCompleted={showCompleted}
            />
          ))
        ) : (
          (() => {
            const allGroup = groupedProjects.get('all')
            if (!allGroup) return null
            const projects = showCompleted
              ? allGroup.projects
              : allGroup.projects.filter((p) => p.status !== 'completed')

            return projects.map((project) => (
              <ProjectRow key={project.id} project={project} onSelect={onSelectProject} />
            ))
          })()
        )}
      </div>

      {/* Empty state */}
      {groupedProjects.size === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Aucun projet trouvé
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────

export function ProjectTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/30">
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-28 hidden sm:block" />
        <Skeleton className="h-4 w-32 hidden md:block" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28 hidden sm:block" />
        <Skeleton className="h-4 w-24 hidden sm:block" />
      </div>

      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50"
        >
          <div className="flex-1 flex items-center gap-2">
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <Skeleton className="h-4 w-20 hidden sm:block" />
          <Skeleton className="h-4 w-24 hidden md:block" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-1.5 w-28 rounded-full hidden sm:block" />
          <Skeleton className="h-3 w-16 hidden sm:block" />
        </div>
      ))}
    </div>
  )
}
