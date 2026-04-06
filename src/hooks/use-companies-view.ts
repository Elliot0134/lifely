'use client'

import { useCallback, useMemo } from 'react'
import type { CompanyFilters } from '@/types/tasks'
import { useViewPreferences } from '@/hooks/use-view-preferences'

// ─── Types ───────────────────────────────────────────

export type CompanyViewMode = 'kanban' | 'table'
export type CompanyGroupBy = 'group' | 'ownership' | 'status' | 'none'
export type CompanySubGroupBy = 'ownership' | 'status' | 'none'

// ─── Defaults ────────────────────────────────────────

const DEFAULTS = {
  viewMode: 'kanban' as CompanyViewMode,
  groupBy: 'group' as CompanyGroupBy,
  subGroupBy: 'none' as CompanySubGroupBy,
}

// ─── Hook ────────────────────────────────────────────

export function useCompaniesView() {
  const { preferences, updatePreferences } = useViewPreferences({
    pageKey: 'companies',
    defaults: DEFAULTS,
  })

  // Typed getters
  const viewMode = (preferences.viewMode ?? DEFAULTS.viewMode) as CompanyViewMode
  const groupBy = (preferences.groupBy ?? DEFAULTS.groupBy) as CompanyGroupBy
  const subGroupBy = (preferences.subGroupBy ?? DEFAULTS.subGroupBy) as CompanySubGroupBy

  // Filters are ephemeral (not persisted to DB)
  const { preferences: filterPrefs, updatePreferences: updateFilterPrefs } = useViewPreferences({
    pageKey: '_companies_filters',
    defaults: {},
  })
  const filters: CompanyFilters = useMemo(() => {
    const f: CompanyFilters = {}
    if (filterPrefs.group_id) f.group_id = filterPrefs.group_id as string
    if (filterPrefs.ownership_type) f.ownership_type = filterPrefs.ownership_type as CompanyFilters['ownership_type']
    if (filterPrefs.status) f.status = filterPrefs.status as CompanyFilters['status']
    if (filterPrefs.search) f.search = filterPrefs.search as string
    return f
  }, [filterPrefs])

  // Setters
  const setViewMode = useCallback((v: CompanyViewMode) => updatePreferences({ viewMode: v }), [updatePreferences])
  const setGroupBy = useCallback((v: CompanyGroupBy) => updatePreferences({ groupBy: v }), [updatePreferences])
  const setSubGroupBy = useCallback((v: CompanySubGroupBy) => updatePreferences({ subGroupBy: v }), [updatePreferences])

  const setFilters = useCallback((f: CompanyFilters) => {
    updateFilterPrefs({
      group_id: f.group_id,
      ownership_type: f.ownership_type,
      status: f.status,
      search: f.search,
    })
  }, [updateFilterPrefs])

  const clearFilters = useCallback(() => {
    updateFilterPrefs({
      group_id: undefined,
      ownership_type: undefined,
      status: undefined,
      search: undefined,
    })
  }, [updateFilterPrefs])

  return {
    viewMode, groupBy, subGroupBy, filters,
    setViewMode, setGroupBy, setSubGroupBy,
    setFilters, clearFilters,
  }
}
