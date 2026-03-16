'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, Calendar, CheckCircle2, ListTodo } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TASK_DUE_STATUS_COLORS } from '@/lib/constants'
import { useToggleTask } from '@/lib/queries/tasks'
import type { Task, TaskDueStatus } from '@/types/tasks'

// ─── Group configuration ────────────────────────────────────

interface GroupConfig {
  key: TaskDueStatus
  label: string
  defaultOpen: boolean
}

const GROUPS: GroupConfig[] = [
  { key: 'overdue', label: 'En retard', defaultOpen: true },
  { key: 'today', label: "Aujourd'hui", defaultOpen: true },
  { key: 'upcoming', label: 'A venir', defaultOpen: true },
  { key: 'future', label: 'Plus tard', defaultOpen: true },
  { key: 'no_date', label: 'Sans date', defaultOpen: true },
  { key: 'completed', label: 'Completees', defaultOpen: false },
]

// ─── Helpers ─────────────────────────────────────────────────

function formatDueDate(task: Task): string | null {
  const date = task.due_date ?? task.due_datetime
  if (!date) return null

  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

// ─── Task Item (minimal) ────────────────────────────────────

function TaskItem({ task }: { task: Task }) {
  const toggleMutation = useToggleTask()
  const dueLabel = formatDueDate(task)

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors group">
      <Checkbox
        checked={task.is_completed}
        onCheckedChange={() => toggleMutation.mutate(task.id)}
        disabled={toggleMutation.isPending}
        aria-label={`Marquer "${task.title}" comme ${task.is_completed ? 'non completee' : 'completee'}`}
      />

      <span
        className={cn(
          'flex-1 text-sm truncate',
          task.is_completed && 'line-through text-muted-foreground'
        )}
      >
        {task.title}
      </span>

      {task.project_name && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 hidden sm:inline-flex">
          <div
            className="h-1.5 w-1.5 rounded-full mr-1"
            style={{ backgroundColor: task.project_color ?? '#64748b' }}
          />
          {task.project_name}
        </Badge>
      )}

      {dueLabel && (
        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {dueLabel}
        </span>
      )}
    </div>
  )
}

// ─── Task Group ──────────────────────────────────────────────

function TaskGroup({
  config,
  tasks,
}: {
  config: GroupConfig
  tasks: Task[]
}) {
  const [open, setOpen] = useState(config.defaultOpen)
  const color = TASK_DUE_STATUS_COLORS[config.key]

  if (tasks.length === 0) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-1 group/trigger cursor-pointer">
        <ChevronRight
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-90'
          )}
        />
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium">{config.label}</span>
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 ml-1"
        >
          {tasks.length}
        </Badge>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-5 border-l pl-2 space-y-0.5">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────

export function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
          <div className="ml-5 border-l pl-2 space-y-1">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-4 w-4 rounded-[4px]" />
                <Skeleton className="h-4 flex-1 max-w-[200px]" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────

export function TaskListEmpty() {
  return (
    <Card className="bg-card">
      <CardContent className="py-12">
        <div className="text-center text-muted-foreground">
          <ListTodo className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">Aucune tache</p>
          <p className="text-sm">
            Vos taches apparaitront ici une fois creees
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ──────────────────────────────────────────

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  const grouped = useMemo(() => {
    const map = new Map<TaskDueStatus, Task[]>()

    for (const group of GROUPS) {
      map.set(group.key, [])
    }

    for (const task of tasks) {
      const status: TaskDueStatus = task.due_status ?? (task.is_completed ? 'completed' : 'no_date')
      const list = map.get(status)
      if (list) {
        list.push(task)
      } else {
        // Fallback: put in no_date
        map.get('no_date')!.push(task)
      }
    }

    return map
  }, [tasks])

  const hasAny = GROUPS.some((g) => (grouped.get(g.key)?.length ?? 0) > 0)

  if (!hasAny) {
    return <TaskListEmpty />
  }

  return (
    <div className="space-y-2">
      {GROUPS.map((config) => (
        <TaskGroup
          key={config.key}
          config={config}
          tasks={grouped.get(config.key) ?? []}
        />
      ))}
    </div>
  )
}
