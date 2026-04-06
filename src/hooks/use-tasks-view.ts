'use client'

import { useCallback, useMemo } from 'react'
import type { Task, TaskFilters } from '@/types/tasks'
import { TASK_STATUSES, EISENHOWER_QUADRANTS, TASK_DUE_STATUS_COLORS } from '@/lib/constants'
import { useViewPreferences } from '@/hooks/use-view-preferences'

// ─── Types ───────────────────────────────────────────

export type ViewMode = 'kanban' | 'table'
export type GroupBy = 'project' | 'status' | 'due_status' | 'urgency' | 'company' | 'none'
export type SubGroupBy = 'status' | 'urgency' | 'none'
export type SortBy = 'due_date' | 'title' | 'urgency' | 'created_at'

export interface TaskSubGroup {
  label: string
  color: string
  tasks: Task[]
}

export interface TaskGroup {
  label: string
  color: string
  tasks: Task[]
  subGroups?: Map<string, TaskSubGroup>
}

// ─── Due status labels ───────────────────────────────

const DUE_STATUS_LABELS: Record<string, string> = {
  overdue: 'En retard',
  today: "Aujourd'hui",
  upcoming: 'À venir',
  future: 'Plus tard',
  no_date: 'Sans date',
}

// ─── Sub-group builder ───────────────────────────────

function buildSubGroups(tasks: Task[], by: SubGroupBy): Map<string, TaskSubGroup> {
  const subs = new Map<string, TaskSubGroup>()

  if (by === 'status') {
    for (const s of TASK_STATUSES) {
      subs.set(s.value, { label: s.label, color: s.color, tasks: [] })
    }
    for (const task of tasks) {
      subs.get(task.status)?.tasks.push(task)
    }
  } else if (by === 'urgency') {
    for (const q of EISENHOWER_QUADRANTS) {
      subs.set(q.key, { label: q.label, color: q.color, tasks: [] })
    }
    for (const task of tasks) {
      let key: string
      if (task.is_urgent && task.is_important) key = 'urgent_important'
      else if (task.is_urgent) key = 'urgent'
      else if (task.is_important) key = 'important'
      else key = 'none'
      subs.get(key)?.tasks.push(task)
    }
  }

  // Remove empty sub-groups
  for (const [key, sub] of subs) {
    if (sub.tasks.length === 0) subs.delete(key)
  }

  return subs
}

// ─── Defaults ────────────────────────────────────────

const DEFAULTS = {
  viewMode: 'kanban' as ViewMode,
  groupBy: 'project' as GroupBy,
  subGroupBy: 'none' as SubGroupBy,
  sortBy: 'created_at' as SortBy,
  sortOrder: 'desc' as 'asc' | 'desc',
  showCompleted: false,
}

// ─── Hook ────────────────────────────────────────────

export function useTasksView() {
  const { preferences, updatePreferences } = useViewPreferences({
    pageKey: 'tasks',
    defaults: DEFAULTS,
  })

  // Typed getters
  const viewMode = (preferences.viewMode ?? DEFAULTS.viewMode) as ViewMode
  const groupBy = (preferences.groupBy ?? DEFAULTS.groupBy) as GroupBy
  const subGroupBy = (preferences.subGroupBy ?? DEFAULTS.subGroupBy) as SubGroupBy
  const sortBy = (preferences.sortBy ?? DEFAULTS.sortBy) as SortBy
  const sortOrder = (preferences.sortOrder ?? DEFAULTS.sortOrder) as 'asc' | 'desc'
  const showCompleted = (preferences.showCompleted ?? DEFAULTS.showCompleted) as boolean

  // Filters are ephemeral — not persisted to DB
  const { preferences: filterPrefs, updatePreferences: updateFilterPrefs } = useViewPreferences({
    pageKey: '_tasks_filters',
    defaults: {},
  })
  const filters: TaskFilters = useMemo(() => {
    const f: TaskFilters = {}
    if (filterPrefs.project_id) f.project_id = filterPrefs.project_id as string
    if (filterPrefs.company_id) f.company_id = filterPrefs.company_id as string
    if (filterPrefs.status) f.status = filterPrefs.status as TaskFilters['status']
    if (filterPrefs.is_code_task !== undefined) f.is_code_task = filterPrefs.is_code_task as boolean
    if (filterPrefs.is_urgent) f.is_urgent = filterPrefs.is_urgent as boolean
    if (filterPrefs.is_important) f.is_important = filterPrefs.is_important as boolean
    if (filterPrefs.search) f.search = filterPrefs.search as string
    return f
  }, [filterPrefs])

  // Setters
  const setViewMode = useCallback((v: ViewMode) => updatePreferences({ viewMode: v }), [updatePreferences])
  const setGroupBy = useCallback((v: GroupBy) => updatePreferences({ groupBy: v }), [updatePreferences])
  const setSubGroupBy = useCallback((v: SubGroupBy) => updatePreferences({ subGroupBy: v }), [updatePreferences])
  const setSortBy = useCallback((v: SortBy) => updatePreferences({ sortBy: v }), [updatePreferences])
  const setShowCompleted = useCallback((v: boolean) => updatePreferences({ showCompleted: v }), [updatePreferences])
  const toggleSortOrder = useCallback(() => {
    updatePreferences({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })
  }, [sortOrder, updatePreferences])

  const setFilters = useCallback((f: TaskFilters) => {
    updateFilterPrefs({
      project_id: f.project_id,
      company_id: f.company_id,
      status: f.status,
      is_code_task: f.is_code_task,
      is_urgent: f.is_urgent,
      is_important: f.is_important,
      search: f.search,
    })
  }, [updateFilterPrefs])

  const clearFilters = useCallback(() => {
    updateFilterPrefs({
      project_id: undefined, company_id: undefined, status: undefined,
      is_code_task: undefined, is_urgent: undefined, is_important: undefined,
      search: undefined,
    })
  }, [updateFilterPrefs])

  // ─── groupTasks ──────────────────────────────────

  const groupTasks = useCallback(
    (tasks: Task[]): Map<string, TaskGroup> => {
      const groups = new Map<string, TaskGroup>()

      switch (groupBy) {
        case 'project': {
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

      // Apply sub-grouping if enabled
      if (subGroupBy !== 'none' && subGroupBy !== groupBy) {
        for (const [, group] of groups) {
          group.subGroups = buildSubGroups(group.tasks, subGroupBy)
        }
      }

      return groups
    },
    [groupBy, subGroupBy]
  )

  // ─── sortTasks ───────────────────────────────────

  const sortTasks = useCallback(
    (tasks: Task[]): Task[] => {
      const sorted = [...tasks]
      const dir = sortOrder === 'asc' ? 1 : -1

      sorted.sort((a, b) => {
        switch (sortBy) {
          case 'due_date': {
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
            return dir * (score(b) - score(a))
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
    viewMode, groupBy, subGroupBy, sortBy, sortOrder, filters, showCompleted,
    setViewMode, setGroupBy, setSubGroupBy, setSortBy, toggleSortOrder,
    setFilters, setShowCompleted, clearFilters,
    groupTasks, sortTasks,
  }
}
