'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Task, TaskFilters } from '@/types/tasks'
import { TASK_STATUSES, EISENHOWER_QUADRANTS, TASK_DUE_STATUS_COLORS } from '@/lib/constants'

// ─── Types ───────────────────────────────────────────

export type ViewMode = 'kanban' | 'table'
export type GroupBy = 'project' | 'status' | 'due_status' | 'urgency' | 'company' | 'none'
export type SortBy = 'due_date' | 'title' | 'urgency' | 'created_at'

export interface TaskGroup {
  label: string
  color: string
  tasks: Task[]
}

// ─── Due status labels ───────────────────────────────

const DUE_STATUS_LABELS: Record<string, string> = {
  overdue: 'En retard',
  today: "Aujourd'hui",
  upcoming: 'À venir',
  future: 'Plus tard',
  no_date: 'Sans date',
}

// ─── Hook ────────────────────────────────────────────

const STORAGE_KEY = 'lifely-tasks-view'

function getStoredViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'kanban'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'kanban' || stored === 'table') return stored
  } catch { /* SSR or storage error */ }
  return 'kanban'
}

export function useTasksView() {
  const [viewMode, setViewModeState] = useState<ViewMode>(getStoredViewMode)
  const [groupBy, setGroupBy] = useState<GroupBy>('project')
  const [sortBy, setSortBy] = useState<SortBy>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<TaskFilters>({})
  const [showCompleted, setShowCompleted] = useState(false)

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    try { localStorage.setItem(STORAGE_KEY, mode) } catch { /* noop */ }
  }, [])

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  // ─── groupTasks ──────────────────────────────────

  const groupTasks = useCallback(
    (tasks: Task[]): Map<string, TaskGroup> => {
      const groups = new Map<string, TaskGroup>()

      switch (groupBy) {
        case 'project': {
          // Initialize with tasks' projects + a fallback
          groups.set('no_project', { label: 'Sans projet', color: '#64748b', tasks: [] })
          for (const task of tasks) {
            const key = task.project_id ?? 'no_project'
            if (!groups.has(key)) {
              groups.set(key, {
                label: task.project_name ?? 'Sans projet',
                color: task.project_color ?? '#64748b',
                tasks: [],
              })
            }
            groups.get(key)!.tasks.push(task)
          }
          break
        }

        case 'status': {
          for (const s of TASK_STATUSES) {
            groups.set(s.value, { label: s.label, color: s.color, tasks: [] })
          }
          for (const task of tasks) {
            groups.get(task.status)!.tasks.push(task)
          }
          break
        }

        case 'due_status': {
          const keys = ['overdue', 'today', 'upcoming', 'future', 'no_date'] as const
          for (const k of keys) {
            groups.set(k, {
              label: DUE_STATUS_LABELS[k],
              color: TASK_DUE_STATUS_COLORS[k],
              tasks: [],
            })
          }
          for (const task of tasks) {
            const key = task.due_status ?? 'no_date'
            groups.get(key)!.tasks.push(task)
          }
          break
        }

        case 'urgency': {
          for (const q of EISENHOWER_QUADRANTS) {
            groups.set(q.key, { label: q.label, color: q.color, tasks: [] })
          }
          for (const task of tasks) {
            let key: string
            if (task.is_urgent && task.is_important) key = 'urgent_important'
            else if (task.is_urgent) key = 'urgent'
            else if (task.is_important) key = 'important'
            else key = 'none'
            groups.get(key)!.tasks.push(task)
          }
          break
        }

        case 'company': {
          groups.set('no_company', { label: 'Personnel', color: '#64748b', tasks: [] })
          for (const task of tasks) {
            const key = task.company_name ?? 'no_company'
            if (!groups.has(key)) {
              groups.set(key, {
                label: task.company_name ?? 'Personnel',
                color: task.company_color ?? '#64748b',
                tasks: [],
              })
            }
            groups.get(key)!.tasks.push(task)
          }
          break
        }

        case 'none': {
          groups.set('all', { label: 'Toutes les tâches', color: '#64748b', tasks: [...tasks] })
          break
        }
      }

      return groups
    },
    [groupBy]
  )

  // ─── sortTasks ───────────────────────────────────

  const sortTasks = useCallback(
    (tasks: Task[]): Task[] => {
      const sorted = [...tasks]
      const dir = sortOrder === 'asc' ? 1 : -1

      sorted.sort((a, b) => {
        switch (sortBy) {
          case 'due_date': {
            // Nulls last regardless of sort direction
            if (!a.due_date && !b.due_date) return 0
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return dir * a.due_date.localeCompare(b.due_date)
          }

          case 'title': {
            return dir * a.title.localeCompare(b.title, 'fr')
          }

          case 'urgency': {
            const score = (t: Task) => {
              if (t.is_urgent && t.is_important) return 3
              if (t.is_urgent) return 2
              if (t.is_important) return 1
              return 0
            }
            return dir * (score(b) - score(a)) // Higher score = more urgent
          }

          case 'created_at': {
            return dir * a.created_at.localeCompare(b.created_at)
          }

          default:
            return 0
        }
      })

      return sorted
    },
    [sortBy, sortOrder]
  )

  return {
    // State
    viewMode,
    groupBy,
    sortBy,
    sortOrder,
    filters,
    showCompleted,
    // Setters
    setViewMode,
    setGroupBy,
    setSortBy,
    toggleSortOrder,
    setFilters,
    setShowCompleted,
    clearFilters,
    // Functions
    groupTasks,
    sortTasks,
  }
}
