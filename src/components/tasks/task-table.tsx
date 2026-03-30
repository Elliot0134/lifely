'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Code,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { TASK_DUE_STATUS_COLORS } from '@/lib/constants'
import type { Task, TaskDueStatus, TaskStatus } from '@/types/tasks'
import type { GroupBy, SortBy } from '@/hooks/use-tasks-view'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TagBadge } from '@/components/tags/tag-badge'
import { TaskStatusCheckbox } from '@/components/tasks/task-status-checkbox'

// ─── Types ──────────────────────────────────────────────

interface TaskGroup {
  label: string
  color: string
  tasks: Task[]
}

interface TaskTableProps {
  groupedTasks: Map<string, TaskGroup>
  groupBy: GroupBy
  onSelectTask: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  showCompleted: boolean
  sortBy: SortBy
  sortOrder: 'asc' | 'desc'
  onSortChange: (column: SortBy) => void
}

// ─── Column config ──────────────────────────────────────

interface Column {
  key: SortBy | 'status' | 'code' | 'tags'
  label: string
  sortable: boolean
  sortKey?: SortBy
  className: string
  headerClassName?: string
}

const COLUMNS: Column[] = [
  {
    key: 'status',
    label: '',
    sortable: false,
    className: 'w-10',
  },
  {
    key: 'title',
    label: 'Titre',
    sortable: true,
    sortKey: 'title',
    className: 'flex-1 min-w-0',
  },
  {
    key: 'due_date',
    label: 'Échéance',
    sortable: true,
    sortKey: 'due_date',
    className: 'w-24 text-right',
  },
  {
    key: 'urgency',
    label: 'Urgence',
    sortable: true,
    sortKey: 'urgency',
    className: 'w-20 hidden sm:flex',
  },
  {
    key: 'code',
    label: 'Code',
    sortable: false,
    className: 'w-12 hidden sm:flex',
  },
  {
    key: 'tags',
    label: 'Tags',
    sortable: false,
    className: 'w-36 hidden md:flex',
  },
]

// ─── Helpers ────────────────────────────────────────────

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const taskDate = new Date(date)
  taskDate.setHours(0, 0, 0, 0)

  if (taskDate.getTime() === today.getTime()) return "Aujourd'hui"
  if (taskDate.getTime() === tomorrow.getTime()) return 'Demain'

  return format(date, 'd MMM', { locale: fr })
}

// ─── Sort header ────────────────────────────────────────

function SortIcon({
  column,
  currentSort,
  sortOrder,
}: {
  column: Column
  currentSort: SortBy
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

function TaskRow({
  task,
  onSelect,
  onStatusChange,
}: {
  task: Task
  onSelect: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}) {
  const isCompleted = task.status === 'completed'
  const dueDate = task.due_date ?? task.due_datetime
  const dueStatusColor = task.due_status
    ? TASK_DUE_STATUS_COLORS[task.due_status as TaskDueStatus]
    : undefined

  const visibleTags = task.tags?.slice(0, 2) ?? []
  const extraTagCount = (task.tags?.length ?? 0) - visibleTags.length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(task)
        }
      }}
      className={cn(
        'flex items-center gap-3 px-3 py-2 border-b border-border/50 cursor-pointer',
        'transition-colors hover:bg-accent/50',
        isCompleted && 'opacity-50'
      )}
    >
      {/* Status */}
      <div
        className="w-10 flex items-center justify-center shrink-0"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <TaskStatusCheckbox
          status={task.status}
          onChange={(newStatus) => onStatusChange(task.id, newStatus)}
          size="sm"
        />
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span
          className={cn(
            'text-sm font-medium truncate',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </span>
        {task.project_name && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: task.project_color ?? '#64748b' }}
            />
            {task.project_name}
          </span>
        )}
        {(task.subtask_count ?? 0) > 0 && (
          <span className="text-xs text-muted-foreground shrink-0">
            {task.subtask_completed_count ?? 0}/{task.subtask_count}
          </span>
        )}
      </div>

      {/* Due date */}
      <div className="w-24 text-right shrink-0">
        {dueDate && (
          <span
            className="text-xs font-medium"
            style={{ color: dueStatusColor }}
          >
            {formatDueDate(dueDate)}
          </span>
        )}
      </div>

      {/* Urgency badges */}
      <div className="w-20 hidden sm:flex items-center gap-1 shrink-0">
        {task.is_urgent && (
          <Badge
            variant="outline"
            className="px-1 py-0 text-[10px] border-destructive/30 text-destructive"
          >
            Urgent
          </Badge>
        )}
        {task.is_important && (
          <Badge
            variant="outline"
            className="px-1 py-0 text-[10px] border-orange-600/30 text-orange-700 dark:text-orange-400"
          >
            Imp.
          </Badge>
        )}
      </div>

      {/* Code */}
      <div className="w-12 hidden sm:flex items-center justify-center shrink-0">
        {task.is_code_task && (
          <Code className="h-3.5 w-3.5 text-blue-500" />
        )}
      </div>

      {/* Tags */}
      <div className="w-36 hidden md:flex items-center gap-1 shrink-0">
        {visibleTags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} size="sm" />
        ))}
        {extraTagCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            +{extraTagCount}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Group section ──────────────────────────────────────

function GroupSection({
  groupKey,
  group,
  onSelectTask,
  onStatusChange,
  showCompleted,
}: {
  groupKey: string
  group: TaskGroup
  onSelectTask: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  showCompleted: boolean
}) {
  const [isOpen, setIsOpen] = useState(true)
  const filteredTasks = showCompleted
    ? group.tasks
    : group.tasks.filter((t) => t.status !== 'completed')

  if (filteredTasks.length === 0) return null

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
          {filteredTasks.length}
        </Badge>
      </button>

      {isOpen && (
        <div>
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onSelect={onSelectTask}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────

export function TaskTable({
  groupedTasks,
  groupBy,
  onSelectTask,
  onStatusChange,
  showCompleted,
  sortBy,
  sortOrder,
  onSortChange,
}: TaskTableProps) {
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
                isSorted && 'text-foreground',
                col.headerClassName
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
          Array.from(groupedTasks.entries()).map(([key, group]) => (
            <GroupSection
              key={key}
              groupKey={key}
              group={group}
              onSelectTask={onSelectTask}
              onStatusChange={onStatusChange}
              showCompleted={showCompleted}
            />
          ))
        ) : (
          (() => {
            const allGroup = groupedTasks.get('all')
            if (!allGroup) return null
            const tasks = showCompleted
              ? allGroup.tasks
              : allGroup.tasks.filter((t) => t.status !== 'completed')

            return tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onSelect={onSelectTask}
                onStatusChange={onStatusChange}
              />
            ))
          })()
        )}
      </div>

      {/* Empty state */}
      {groupedTasks.size === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Aucune tâche trouvée
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────

export function TaskTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/30">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20 hidden sm:block" />
        <Skeleton className="h-4 w-12 hidden sm:block" />
        <Skeleton className="h-4 w-36 hidden md:block" />
      </div>

      {/* Row skeletons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50"
        >
          <Skeleton className="h-4 w-4 rounded-full shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-8 hidden sm:block" />
          <Skeleton className="h-4 w-4 hidden sm:block" />
          <div className="hidden md:flex gap-1 w-36">
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
