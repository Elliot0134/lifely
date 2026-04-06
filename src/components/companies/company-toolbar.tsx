'use client'

import { Search, X, SlidersHorizontal, Kanban, List } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { COMPANY_STATUSES, OWNERSHIP_TYPES } from '@/lib/constants'
import { CompanyModal } from '@/components/companies/company-modal'
import { CompanyGroupModal } from '@/components/companies/company-group-modal'
import type { CompanyFilters, CompanyGroup } from '@/types/tasks'
import type { CompanyViewMode, CompanyGroupBy, CompanySubGroupBy } from '@/hooks/use-companies-view'

interface CompanyToolbarProps {
  viewMode: CompanyViewMode
  setViewMode: (mode: CompanyViewMode) => void
  groupBy: CompanyGroupBy
  setGroupBy: (groupBy: CompanyGroupBy) => void
  subGroupBy: CompanySubGroupBy
  setSubGroupBy: (subGroupBy: CompanySubGroupBy) => void
  filters: CompanyFilters
  setFilters: (filters: CompanyFilters) => void
  clearFilters: () => void
  groups: CompanyGroup[]
}

export function CompanyToolbar({
  viewMode,
  setViewMode,
  groupBy,
  setGroupBy,
  subGroupBy,
  setSubGroupBy,
  filters,
  setFilters,
  clearFilters,
  groups,
}: CompanyToolbarProps) {
  const activeFilterCount = [
    filters.group_id,
    filters.ownership_type,
    filters.status,
  ].filter(Boolean).length

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Actions + Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CompanyModal />
          <CompanyGroupModal />
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-48 hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={filters.search ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value || undefined })
              }
              className="pl-8 h-9"
            />
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setFilters({ ...filters, search: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Group by */}
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as CompanyGroupBy)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="group">Par groupe</SelectItem>
              <SelectItem value="ownership">Par relation</SelectItem>
              <SelectItem value="status">Par statut</SelectItem>
              <SelectItem value="none">Sans groupement</SelectItem>
            </SelectContent>
          </Select>

          {/* Sub-group by (only in kanban, hidden when same as groupBy) */}
          {viewMode === 'kanban' && groupBy !== 'none' && (
            <Select value={subGroupBy} onValueChange={(v) => setSubGroupBy(v as CompanySubGroupBy)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Pas de sous-groupe</SelectItem>
                {groupBy !== 'ownership' && (
                  <SelectItem value="ownership">Sous-groupe: relation</SelectItem>
                )}
                {groupBy !== 'status' && (
                  <SelectItem value="status">Sous-groupe: statut</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}

          {/* Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filtres</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <p className="text-sm font-medium">Filtres</p>

                {/* Group filter */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Groupe</label>
                  <Select
                    value={filters.group_id ?? '_all'}
                    onValueChange={(v) =>
                      setFilters({ ...filters, group_id: v === '_all' ? undefined : v })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Tous les groupes</SelectItem>
                      <SelectItem value="_ungrouped">Sans groupe</SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.icon ? `${g.icon} ` : ''}{g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ownership filter */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Relation</label>
                  <Select
                    value={filters.ownership_type ?? '_all'}
                    onValueChange={(v) =>
                      setFilters({ ...filters, ownership_type: v === '_all' ? undefined : v as CompanyFilters['ownership_type'] })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Toutes les relations</SelectItem>
                      {OWNERSHIP_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status filter */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Statut</label>
                  <Select
                    value={filters.status ?? '_all'}
                    onValueChange={(v) =>
                      setFilters({ ...filters, status: v === '_all' ? undefined : v as CompanyFilters['status'] })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Tous les statuts</SelectItem>
                      {COMPANY_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={clearFilters}
                  >
                    Effacer les filtres
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* View mode toggle — same style as tasks */}
          <div className="flex items-center rounded-md border bg-muted p-0.5">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('kanban')}
            >
              <Kanban className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={filters.search ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value || undefined })
            }
            className="pl-8 h-9"
          />
        </div>
      </div>
    </div>
  )
}
