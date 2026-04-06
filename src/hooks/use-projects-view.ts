'use client'

import { useCallback, useMemo } from 'react'
import type { Project, ProjectFilters } from '@/types/tasks'
import { PROJECT_STATUSES } from '@/lib/constants'
import { useViewPreferences } from '@/hooks/use-view-preferences'

// ─── Types ───────────────────────────────────────────

export type ProjectViewMode = 'kanban' | 'table'
export type ProjectGroupBy = 'status' | 'company' | 'none'
export type ProjectSubGroupBy = 'status' | 'company' | 'none'
export type ProjectSortBy = 'name' | 'end_date' | 'created_at' | 'progress'

export interface ProjectSubGroup {
  label: string
  color: string
  projects: Project[]
}

export interface ProjectGroup {
  label: string
  color: string
  projects: Project[]
  subGroups?: Map<string, ProjectSubGroup>
}

// ─── Sub-group builder ──────────────────────────────

function buildSubGroups(projects: Project[], by: ProjectSubGroupBy): Map<string, ProjectSubGroup> {
  const subs = new Map<string, ProjectSubGroup>()

  if (by === 'status') {
    for (const s of PROJECT_STATUSES) {
      subs.set(s.value, { label: s.label, color: s.color, projects: [] })
    }
    for (const project of projects) {
      subs.get(project.status)?.projects.push(project)
    }
  } else if (by === 'company') {
    subs.set('no_company', { label: 'Personnel', color: '#64748b', projects: [] })
    for (const project of projects) {
      const key = project.company?.id ?? 'no_company'
      if (!subs.has(key)) {
        subs.set(key, {
          label: project.company?.name ?? 'Personnel',
          color: project.company?.color ?? '#64748b',
          projects: [],
        })
      }
      subs.get(key)!.projects.push(project)
    }
  }

  // Remove empty sub-groups
  for (const [key, sub] of subs) {
    if (sub.projects.length === 0) subs.delete(key)
  }

  return subs
}

// ─── Defaults ────────────────────────────────────────

const DEFAULTS = {
  viewMode: 'kanban' as ProjectViewMode,
  groupBy: 'status' as ProjectGroupBy,
  subGroupBy: 'none' as ProjectSubGroupBy,
  sortBy: 'created_at' as ProjectSortBy,
  sortOrder: 'desc' as 'asc' | 'desc',
  showCompleted: false,
}

// ─── Hook ────────────────────────────────────────────

export function useProjectsView() {
  const { preferences, updatePreferences } = useViewPreferences({
    pageKey: 'projects',
    defaults: DEFAULTS,
  })

  // Typed getters
  const viewMode = (preferences.viewMode ?? DEFAULTS.viewMode) as ProjectViewMode
  const groupBy = (preferences.groupBy ?? DEFAULTS.groupBy) as ProjectGroupBy
  const subGroupBy = (preferences.subGroupBy ?? DEFAULTS.subGroupBy) as ProjectSubGroupBy
  const sortBy = (preferences.sortBy ?? DEFAULTS.sortBy) as ProjectSortBy
  const sortOrder = (preferences.sortOrder ?? DEFAULTS.sortOrder) as 'asc' | 'desc'
  const showCompleted = (preferences.showCompleted ?? DEFAULTS.showCompleted) as boolean

  // Filters are NOT persisted (ephemeral per session)
  const { preferences: filterPrefs, updatePreferences: updateFilterPrefs } = useViewPreferences({
    pageKey: '_projects_filters',
    defaults: {},
  })
  const filters: ProjectFilters = useMemo(() => {
    const f: ProjectFilters = {}
    if (filterPrefs.company_id) f.company_id = filterPrefs.company_id as string
    if (filterPrefs.status) f.status = filterPrefs.status as ProjectFilters['status']
    if (filterPrefs.search) f.search = filterPrefs.search as string
    return f
  }, [filterPrefs])

  // Setters
  const setViewMode = useCallback((v: ProjectViewMode) => updatePreferences({ viewMode: v }), [updatePreferences])
  const setGroupBy = useCallback((v: ProjectGroupBy) => updatePreferences({ groupBy: v }), [updatePreferences])
  const setSubGroupBy = useCallback((v: ProjectSubGroupBy) => updatePreferences({ subGroupBy: v }), [updatePreferences])
  const setSortBy = useCallback((v: ProjectSortBy) => updatePreferences({ sortBy: v }), [updatePreferences])
  const setShowCompleted = useCallback((v: boolean) => updatePreferences({ showCompleted: v }), [updatePreferences])
  const toggleSortOrder = useCallback(() => {
    updatePreferences({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })
  }, [sortOrder, updatePreferences])

  const setFilters = useCallback((f: ProjectFilters) => {
    updateFilterPrefs({
      company_id: f.company_id,
      status: f.status,
      search: f.search,
    })
  }, [updateFilterPrefs])

  const clearFilters = useCallback(() => {
    updateFilterPrefs({ company_id: undefined, status: undefined, search: undefined })
  }, [updateFilterPrefs])

  // ─── groupProjects ──────────────────────────────────

  const groupProjects = useCallback(
    (projects: Project[]): Map<string, ProjectGroup> => {
      const groups = new Map<string, ProjectGroup>()

      switch (groupBy) {
        case 'status': {
          for (const s of PROJECT_STATUSES) {
            groups.set(s.value, { label: s.label, color: s.color, projects: [] })
          }
          for (const project of projects) {
            groups.get(project.status)?.projects.push(project)
          }
          break
        }

        case 'company': {
          groups.set('no_company', { label: 'Personnel', color: '#64748b', projects: [] })
          for (const project of projects) {
            const key = project.company?.id ?? 'no_company'
            if (!groups.has(key)) {
              groups.set(key, {
                label: project.company?.name ?? 'Personnel',
                color: project.company?.color ?? '#64748b',
                projects: [],
              })
            }
            groups.get(key)!.projects.push(project)
          }
          break
        }

        case 'none': {
          groups.set('all', { label: 'Tous les projets', color: '#64748b', projects: [...projects] })
          break
        }
      }

      // Apply sub-grouping if enabled
      if (subGroupBy !== 'none' && subGroupBy !== groupBy) {
        for (const [, group] of groups) {
          group.subGroups = buildSubGroups(group.projects, subGroupBy)
        }
      }

      return groups
    },
    [groupBy, subGroupBy]
  )

  // ─── sortProjects ───────────────────────────────────

  const sortProjects = useCallback(
    (projects: Project[]): Project[] => {
      const sorted = [...projects]
      const dir = sortOrder === 'asc' ? 1 : -1

      sorted.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return dir * a.name.localeCompare(b.name, 'fr')
          case 'end_date': {
            if (!a.end_date && !b.end_date) return 0
            if (!a.end_date) return 1
            if (!b.end_date) return -1
            return dir * a.end_date.localeCompare(b.end_date)
          }
          case 'created_at':
            return dir * a.created_at.localeCompare(b.created_at)
          case 'progress':
            return dir * ((a.progress ?? 0) - (b.progress ?? 0))
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
    groupProjects, sortProjects,
  }
}
