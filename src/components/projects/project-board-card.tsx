'use client'

import { Calendar, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROJECT_STATUSES } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@/types/tasks'

// ─── Props ──────────────────────────────────────────────

interface ProjectBoardCardProps {
  project: Project
  onSelect?: (project: Project) => void
  hideStatus?: boolean
  hideCompany?: boolean
  className?: string
}

// ─── Helpers ────────────────────────────────────────────

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

// ─── Component ──────────────────────────────────────────

export function ProjectBoardCard({
  project,
  onSelect,
  hideStatus = false,
  hideCompany = false,
  className,
}: ProjectBoardCardProps) {
  const statusConfig = PROJECT_STATUSES.find((s) => s.value === project.status) ?? PROJECT_STATUSES[0]
  const taskCount = project.task_count ?? 0
  const completedCount = project.completed_task_count ?? 0
  const progress = project.progress ?? 0
  const isCompleted = project.status === 'completed'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(project)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(project)
        }
      }}
      className={cn(
        'rounded-lg border bg-card p-3 transition-shadow cursor-pointer',
        'hover:shadow-sm',
        isCompleted && 'opacity-60',
        className
      )}
    >
      {/* Row 1: Color dot + Name */}
      <div className="flex items-start gap-2">
        {project.color && (
          <span
            className="size-2.5 rounded-full shrink-0 mt-1"
            style={{ backgroundColor: project.color }}
          />
        )}
        <span
          className={cn(
            'flex-1 truncate text-sm font-medium leading-tight',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {project.name}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-muted-foreground truncate mt-1 pl-[18px]">
          {project.description}
        </p>
      )}

      {/* Row 2: Badges */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {!hideCompany && project.company && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: project.company.color ?? '#64748b' }}
            />
            {project.company.name}
          </span>
        )}

        {!hideStatus && (
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
        )}

        {/* Due date */}
        {project.end_date && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="size-3" />
            {formatDate(project.end_date)}
          </span>
        )}

        {/* Task counter */}
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <ListChecks className="size-3" />
          {completedCount}/{taskCount}
        </span>
      </div>

      {/* Progress bar */}
      {taskCount > 0 && (
        <div className="mt-2">
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
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
          <div className="flex justify-end mt-0.5">
            <span className="text-[10px] text-muted-foreground font-medium">{progress}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
