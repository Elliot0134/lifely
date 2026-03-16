'use client'

import { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDailyBriefing } from '@/lib/queries/briefing'
import { TASK_DUE_STATUS_COLORS } from '@/lib/constants'
import {
  ChevronDown,
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  Code2,
  FileText,
  FolderOpen,
  CheckCircle2,
  ListTodo,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, Project } from '@/types/tasks'

// ─── Skeleton ──────────────────────────────────────────

function DailyBriefingSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-5" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Stat Card ─────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color?: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
      <Icon className="size-4 text-muted-foreground" />
      <span
        className="text-lg font-bold leading-none"
        style={color ? { color } : undefined}
      >
        {value}
      </span>
      <span className="text-[11px] leading-tight text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

// ─── Task Item ─────────────────────────────────────────

function BriefingTaskItem({ task }: { task: Task }) {
  const dueLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      })
    : null

  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{
          backgroundColor: task.project_color ?? 'hsl(0 0% 63%)',
        }}
      />
      <span className="truncate">{task.title}</span>
      {task.project_name && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {task.project_name}
        </span>
      )}
      {dueLabel && (
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {dueLabel}
        </span>
      )}
    </li>
  )
}

// ─── Active Project Item ───────────────────────────────

function ActiveProjectItem({
  project,
}: {
  project: Project & { remaining_tasks: number }
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className="size-2 shrink-0 rounded-sm"
        style={{
          backgroundColor: project.color ?? 'hsl(0 0% 63%)',
        }}
      />
      <span className="truncate">{project.name}</span>
      <Badge variant="secondary" className="ml-auto text-[10px]">
        {project.remaining_tasks}
      </Badge>
    </li>
  )
}

// ─── Main Component ────────────────────────────────────

export function DailyBriefing() {
  const [isOpen, setIsOpen] = useState(true)
  const { data: briefing, isLoading, error } = useDailyBriefing()

  if (isLoading) return <DailyBriefingSkeleton />
  if (error || !briefing) return null

  const { stats, overdue, today, upcoming, active_projects } = briefing

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none flex flex-row items-center justify-between space-y-0 pb-2 hover:bg-muted/50 transition-colors rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="size-4" />
              Briefing du jour
              {stats.overdue_count > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 text-[10px] px-1.5"
                >
                  {stats.overdue_count} en retard
                </Badge>
              )}
            </CardTitle>
            <ChevronDown
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-5 pt-2">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard
                label="Taches ouvertes"
                value={stats.total_open}
                icon={ListTodo}
              />
              <StatCard
                label="Completees aujourd'hui"
                value={stats.completed_today}
                icon={CheckCircle2}
                color={TASK_DUE_STATUS_COLORS.completed}
              />
              <StatCard
                label="En retard"
                value={stats.overdue_count}
                icon={AlertTriangle}
                color={
                  stats.overdue_count > 0
                    ? TASK_DUE_STATUS_COLORS.overdue
                    : undefined
                }
              />
              <StatCard
                label="Code"
                value={stats.code_tasks_open}
                icon={Code2}
              />
              <StatCard
                label="Non-code"
                value={stats.non_code_tasks_open}
                icon={FileText}
              />
            </div>

            {/* Sections */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Overdue */}
              {overdue.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-1.5 text-sm font-medium">
                    <AlertTriangle
                      className="size-3.5"
                      style={{ color: TASK_DUE_STATUS_COLORS.overdue }}
                    />
                    En retard
                    <Badge
                      variant="destructive"
                      className="ml-1 text-[10px] px-1.5"
                    >
                      {overdue.length}
                    </Badge>
                  </h4>
                  <ul className="space-y-1.5">
                    {overdue.slice(0, 5).map((task) => (
                      <BriefingTaskItem key={task.id} task={task} />
                    ))}
                    {overdue.length > 5 && (
                      <li className="text-xs text-muted-foreground">
                        +{overdue.length - 5} autres...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Today */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-sm font-medium">
                  <CalendarCheck
                    className="size-3.5"
                    style={{ color: TASK_DUE_STATUS_COLORS.today }}
                  />
                  Aujourd&apos;hui
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                    {today.length}
                  </Badge>
                </h4>
                {today.length > 0 ? (
                  <ul className="space-y-1.5">
                    {today.slice(0, 5).map((task) => (
                      <BriefingTaskItem key={task.id} task={task} />
                    ))}
                    {today.length > 5 && (
                      <li className="text-xs text-muted-foreground">
                        +{today.length - 5} autres...
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Aucune tache pour aujourd&apos;hui
                  </p>
                )}
              </div>

              {/* Upcoming */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-sm font-medium">
                  <CalendarClock
                    className="size-3.5"
                    style={{ color: TASK_DUE_STATUS_COLORS.upcoming }}
                  />
                  A venir
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                    {upcoming.length}
                  </Badge>
                </h4>
                {upcoming.length > 0 ? (
                  <ul className="space-y-1.5">
                    {upcoming.slice(0, 5).map((task) => (
                      <BriefingTaskItem key={task.id} task={task} />
                    ))}
                    {upcoming.length > 5 && (
                      <li className="text-xs text-muted-foreground">
                        +{upcoming.length - 5} autres...
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Rien de prevu
                  </p>
                )}
              </div>
            </div>

            {/* Active projects */}
            {active_projects.length > 0 && (
              <div className="space-y-2 border-t border-border/50 pt-4">
                <h4 className="flex items-center gap-1.5 text-sm font-medium">
                  <FolderOpen className="size-3.5" />
                  Projets actifs
                </h4>
                <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {active_projects.map((project) => (
                    <ActiveProjectItem key={project.id} project={project} />
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
