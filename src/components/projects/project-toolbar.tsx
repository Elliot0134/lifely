'use client'

import { useMemo } from 'react'
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCompanies } from '@/lib/queries/companies'
import { PROJECT_STATUSES } from '@/lib/constants'
import type { ProjectFilters } from '@/types/tasks'
import type {
  ProjectViewMode,
  ProjectGroupBy,
  ProjectSubGroupBy,
  ProjectSortBy,
} from '@/hooks/use-projects-view'

// ─── Props ─────────────────────────────────────────────

interface ProjectToolbarProps {
  viewMode: ProjectViewMode
  setViewMode: (mode: ProjectViewMode) => void
  groupBy: ProjectGroupBy
  setGroupBy: (group: ProjectGroupBy) => void
  subGroupBy: ProjectSubGroupBy
  setSubGroupBy: (sub: ProjectSubGroupBy) => void
  sortBy: ProjectSortBy
  setSortBy: (sort: ProjectSortBy) => void
  sortOrder: 'asc' | 'desc'
  toggleSortOrder: () => void
  filters: ProjectFilters
  setFilters: (filters: ProjectFilters) => void
  clearFilters: () => void
  showCompleted: boolean
  setShowCompleted: (show: boolean) => void
  onCreateProject: () => void
}

// ─── Constants ─────────────────────────────────────────

const GROUP_OPTIONS: { value: ProjectGroupBy; label: string }[] = [
  { value: 'status', label: 'Statut' },
  { value: 'company', label: 'Entreprise' },
  { value: 'none', label: 'Aucun' },
]

const SUB_GROUP_OPTIONS: { value: ProjectSubGroupBy; label: string }[] = [
  { value: 'none', label: 'Aucun' },
  { value: 'status', label: 'Statut' },
  { value: 'company', label: 'Entreprise' },
]

const SORT_OPTIONS: { value: ProjectSortBy; label: string }[] = [
  { value: 'name', label: 'Nom (A-Z)' },
  { value: 'end_date', label: 'Date de fin' },
  { value: 'progress', label: 'Progression' },
  { value: 'created_at', label: 'Création' },
]

// ─── Filter pill ───────────────────────────────────────

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
        aria-label={`Retirer le filtre ${label}`}
      >
        <X className="size-3" />
      </button>
    </Badge>
  )
}

// ─── Filter controls ───────────────────────────────────

function FilterControls({
  filters,
  setFilters,
  companies,
}: {
  filters: ProjectFilters
  setFilters: (f: ProjectFilters) => void
  companies: { id: string; name: string; color?: string | null }[]
}) {
  return (
    <>
      {/* Company */}
      <Select
        value={filters.company_id ?? '_all'}
        onValueChange={(v) =>
          setFilters({ ...filters, company_id: v === '_all' ? undefined : v })
        }
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Entreprise" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Toutes les entreprises</SelectItem>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              <div className="flex items-center gap-2">
                {c.color && (
                  <div
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                )}
                {c.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status ?? '_all'}
        onValueChange={(v) =>
          setFilters({
            ...filters,
            status: v === '_all' ? undefined : (v as ProjectFilters['status']),
          })
        }
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Tous statuts</SelectItem>
          {PROJECT_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

// ─── Main component ────────────────────────────────────

export function ProjectToolbar({
  viewMode,
  setViewMode,
  groupBy,
  setGroupBy,
  subGroupBy,
  setSubGroupBy,
  sortBy,
  setSortBy,
  sortOrder,
  toggleSortOrder,
  filters,
  setFilters,
  clearFilters,
  showCompleted,
  setShowCompleted,
  onCreateProject,
}: ProjectToolbarProps) {
  const { data: companies = [] } = useCompanies()

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.company_id) count++
    if (filters.status) count++
    return count
  }, [filters])

  const activeFilters = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = []

    if (filters.company_id) {
      const company = companies.find((c) => c.id === filters.company_id)
      pills.push({
        key: 'company',
        label: `Entreprise: ${company?.name ?? 'Inconnue'}`,
        onRemove: () => setFilters({ ...filters, company_id: undefined }),
      })
    }

    if (filters.status) {
      const status = PROJECT_STATUSES.find((s) => s.value === filters.status)
      pills.push({
        key: 'status',
        label: `Statut: ${status?.label ?? filters.status}`,
        onRemove: () => setFilters({ ...filters, status: undefined }),
      })
    }

    if (filters.search) {
      pills.push({
        key: 'search',
        label: `Recherche: "${filters.search}"`,
        onRemove: () => setFilters({ ...filters, search: undefined }),
      })
    }

    return pills
  }, [filters, companies, setFilters])

  const hasActiveFilters = activeFilters.length > 0

  return (
    <div className="space-y-3 min-w-0">
      {/* ─── Row 1: View + Sort/Group + Search + Actions ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View toggle */}
        <div className="flex items-center rounded-md border bg-muted/50 p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 w-7 p-0',
                  viewMode === 'kanban' && 'bg-background shadow-sm'
                )}
                onClick={() => setViewMode('kanban')}
                aria-label="Vue Kanban"
              >
                <LayoutGrid className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Kanban</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 w-7 p-0',
                  viewMode === 'table' && 'bg-background shadow-sm'
                )}
                onClick={() => setViewMode('table')}
                aria-label="Vue Table"
              >
                <List className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Table</TooltipContent>
          </Tooltip>
        </div>

        {/* Grouper par */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden sm:flex h-9 gap-1.5 text-xs">
              Grouper: {GROUP_OPTIONS.find((o) => o.value === groupBy)?.label ?? 'Aucun'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={groupBy}
              onValueChange={(v) => setGroupBy(v as ProjectGroupBy)}
            >
              {GROUP_OPTIONS.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sous-grouper par (only when groupBy is not none) */}
        {viewMode === 'kanban' && groupBy !== 'none' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex h-9 gap-1.5 text-xs">
                {subGroupBy === 'none'
                  ? 'Sous-groupe'
                  : `Sous: ${SUB_GROUP_OPTIONS.find((o) => o.value === subGroupBy)?.label}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={subGroupBy}
                onValueChange={(v) => setSubGroupBy(v as ProjectSubGroupBy)}
              >
                {SUB_GROUP_OPTIONS
                  .filter((opt) => opt.value !== groupBy)
                  .map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Trier par */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden sm:flex h-9 gap-1.5 text-xs">
              Trier: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? sortBy}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(v) => setSortBy(v as ProjectSortBy)}
            >
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort order toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex h-9 w-9 p-0"
              onClick={toggleSortOrder}
              aria-label={sortOrder === 'asc' ? 'Tri croissant' : 'Tri décroissant'}
            >
              {sortOrder === 'asc' ? (
                <ArrowUpAZ className="size-4" />
              ) : (
                <ArrowDownAZ className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
          </TooltipContent>
        </Tooltip>

        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-xs ml-auto">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet..."
            value={filters.search ?? ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                search: e.target.value || undefined,
              })
            }
            className="h-9 pl-9 text-sm"
          />
        </div>

        {/* Mobile filters popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden h-9 gap-1.5">
              <Filter className="size-4" />
              <span className="hidden sm:inline">Filtres</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-5 min-w-5 px-1 text-[10px] font-semibold"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
            <div className="space-y-3">
              <p className="text-sm font-medium">Filtres & options</p>

              {/* Group & Sort (mobile only) */}
              <div className="sm:hidden space-y-2">
                <Label className="text-xs text-muted-foreground">Grouper par</Label>
                <Select
                  value={groupBy}
                  onValueChange={(v) => setGroupBy(v as ProjectGroupBy)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label className="text-xs text-muted-foreground">Trier par</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as ProjectSortBy)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={toggleSortOrder}
                  >
                    <ArrowUpDown className="size-4" />
                  </Button>
                </div>
              </div>

              <FilterControls
                filters={filters}
                setFilters={setFilters}
                companies={companies}
              />

              {/* Show completed (mobile) */}
              <div className="sm:hidden flex items-center justify-between">
                <Label htmlFor="show-completed-projects-mobile" className="text-xs text-muted-foreground cursor-pointer">
                  Afficher terminés
                </Label>
                <Switch
                  id="show-completed-projects-mobile"
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* New project button */}
        <Button size="sm" className="h-9 gap-1.5 shrink-0" onClick={onCreateProject}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nouveau</span>
        </Button>
      </div>

      {/* ─── Row 2: Desktop filters ────────────────────── */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        <FilterControls
          filters={filters}
          setFilters={setFilters}
          companies={companies}
        />

        {/* Separator */}
        <div className="h-5 w-px bg-border mx-1" />

        {/* Show completed toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="show-completed-projects"
            checked={showCompleted}
            onCheckedChange={setShowCompleted}
          />
          <Label htmlFor="show-completed-projects" className="text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
            Terminés
          </Label>
        </div>
      </div>

      {/* Show completed toggle — tablet only */}
      <div className="hidden sm:flex lg:hidden items-center gap-2">
        <Switch
          id="show-completed-projects-tablet"
          checked={showCompleted}
          onCheckedChange={setShowCompleted}
        />
        <Label htmlFor="show-completed-projects-tablet" className="text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
          Terminés
        </Label>
      </div>

      {/* ─── Active filter pills ─────────────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {activeFilters.length} filtre{activeFilters.length > 1 ? 's' : ''} actif{activeFilters.length > 1 ? 's' : ''}
          </span>
          {activeFilters.map((pill) => (
            <FilterPill key={pill.key} label={pill.label} onRemove={pill.onRemove} />
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Effacer tout
          </Button>
        </div>
      )}
    </div>
  )
}
