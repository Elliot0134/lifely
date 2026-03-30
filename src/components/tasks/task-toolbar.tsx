'use client'

import { useMemo } from 'react'
import {
  ArrowDownAZ,
  ArrowUpDown,
  ArrowUpAZ,
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
import { useProjects } from '@/lib/queries/task-projects'
import { TASK_STATUSES } from '@/lib/constants'
import type { TaskFilters } from '@/types/tasks'

// ─── Types ──────────────────────────────────────────────

export type ViewMode = 'kanban' | 'table'
export type GroupBy = 'project' | 'status' | 'due_status' | 'urgency' | 'company' | 'none'
export type SubGroupBy = 'status' | 'urgency' | 'none'
export type SortBy = 'due_date' | 'title' | 'urgency' | 'created_at'

interface TaskToolbarProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  groupBy: GroupBy
  setGroupBy: (group: GroupBy) => void
  subGroupBy: SubGroupBy
  setSubGroupBy: (sub: SubGroupBy) => void
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  sortOrder: 'asc' | 'desc'
  toggleSortOrder: () => void
  filters: TaskFilters
  setFilters: (filters: TaskFilters) => void
  clearFilters: () => void
  showCompleted: boolean
  setShowCompleted: (show: boolean) => void
  onCreateTask: () => void
}

// ─── Constants ──────────────────────────────────────────

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'project', label: 'Projet' },
  { value: 'status', label: 'Statut' },
  { value: 'due_status', label: 'Statut délai' },
  { value: 'urgency', label: 'Urgence' },
  { value: 'company', label: 'Entreprise' },
  { value: 'none', label: 'Aucun' },
]

const SUB_GROUP_OPTIONS: { value: SubGroupBy; label: string }[] = [
  { value: 'none', label: 'Aucun' },
  { value: 'status', label: 'Statut' },
  { value: 'urgency', label: 'Urgence' },
]

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'due_date', label: 'Échéance' },
  { value: 'title', label: 'Titre (A-Z)' },
  { value: 'urgency', label: 'Urgence' },
  { value: 'created_at', label: 'Création' },
]

// ─── Filter pill ────────────────────────────────────────

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

// ─── Filter controls (shared between desktop & mobile) ──

function FilterControls({
  filters,
  setFilters,
  projects,
}: {
  filters: TaskFilters
  setFilters: (f: TaskFilters) => void
  projects: { id: string; name: string; color?: string | null }[]
}) {
  return (
    <>
      {/* Project */}
      <Select
        value={filters.project_id ?? '_all'}
        onValueChange={(v) =>
          setFilters({ ...filters, project_id: v === '_all' ? undefined : v })
        }
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Projet" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Tous les projets</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <div className="flex items-center gap-2">
                {p.color && (
                  <div
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                )}
                {p.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Urgency toggles */}
      <div className="flex items-center gap-1">
        <Button
          variant={filters.is_urgent ? 'default' : 'outline'}
          size="sm"
          className="h-9 text-xs"
          onClick={() =>
            setFilters({
              ...filters,
              is_urgent: filters.is_urgent ? undefined : true,
            })
          }
        >
          Urgent
        </Button>
        <Button
          variant={filters.is_important ? 'default' : 'outline'}
          size="sm"
          className="h-9 text-xs"
          onClick={() =>
            setFilters({
              ...filters,
              is_important: filters.is_important ? undefined : true,
            })
          }
        >
          Important
        </Button>
      </div>

      {/* Type */}
      <Select
        value={
          filters.is_code_task === undefined
            ? '_all'
            : filters.is_code_task
              ? 'code'
              : 'non_code'
        }
        onValueChange={(v) =>
          setFilters({
            ...filters,
            is_code_task: v === '_all' ? undefined : v === 'code',
          })
        }
      >
        <SelectTrigger className="w-full sm:w-32">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Tous types</SelectItem>
          <SelectItem value="code">Code</SelectItem>
          <SelectItem value="non_code">Non-code</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status ?? '_all'}
        onValueChange={(v) =>
          setFilters({
            ...filters,
            status: v === '_all' ? undefined : (v as TaskFilters['status']),
          })
        }
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Tous statuts</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

// ─── Main component ─────────────────────────────────────

export function TaskToolbar({
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
  onCreateTask,
}: TaskToolbarProps) {
  const { data: projects = [] } = useProjects()

  // Count active filters for mobile badge
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.project_id) count++
    if (filters.is_urgent) count++
    if (filters.is_important) count++
    if (filters.is_code_task !== undefined) count++
    if (filters.status) count++
    return count
  }, [filters])

  // Active filter pills
  const activeFilters = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = []

    if (filters.project_id) {
      const project = projects.find((p) => p.id === filters.project_id)
      pills.push({
        key: 'project',
        label: `Projet: ${project?.name ?? 'Inconnu'}`,
        onRemove: () => setFilters({ ...filters, project_id: undefined }),
      })
    }

    if (filters.is_urgent) {
      pills.push({
        key: 'urgent',
        label: 'Urgent',
        onRemove: () => setFilters({ ...filters, is_urgent: undefined }),
      })
    }

    if (filters.is_important) {
      pills.push({
        key: 'important',
        label: 'Important',
        onRemove: () => setFilters({ ...filters, is_important: undefined }),
      })
    }

    if (filters.is_code_task !== undefined) {
      pills.push({
        key: 'type',
        label: `Type: ${filters.is_code_task ? 'Code' : 'Non-code'}`,
        onRemove: () => setFilters({ ...filters, is_code_task: undefined }),
      })
    }

    if (filters.status) {
      const status = TASK_STATUSES.find((s) => s.value === filters.status)
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
  }, [filters, projects, setFilters])

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
              onValueChange={(v) => setGroupBy(v as GroupBy)}
            >
              {GROUP_OPTIONS.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sous-grouper par (only when groupBy is not none/status) */}
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
                onValueChange={(v) => setSubGroupBy(v as SubGroupBy)}
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
              onValueChange={(v) => setSortBy(v as SortBy)}
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

        {/* Search — push to the right */}
        <div className="relative flex-1 min-w-0 max-w-xs ml-auto">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
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

        {/* Mobile filters popover (visible only on small screens) */}
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
                  onValueChange={(v) => setGroupBy(v as GroupBy)}
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
                    onValueChange={(v) => setSortBy(v as SortBy)}
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
                projects={projects}
              />

              {/* Show completed (mobile) */}
              <div className="sm:hidden flex items-center justify-between">
                <Label htmlFor="show-completed-mobile" className="text-xs text-muted-foreground cursor-pointer">
                  Afficher terminées
                </Label>
                <Switch
                  id="show-completed-mobile"
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* New task button */}
        <Button size="sm" className="h-9 gap-1.5 shrink-0" onClick={onCreateTask}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nouveau</span>
        </Button>
      </div>

      {/* ─── Row 2: Desktop filters ────────────────────── */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        <FilterControls
          filters={filters}
          setFilters={setFilters}
          projects={projects}
        />

        {/* Separator */}
        <div className="h-5 w-px bg-border mx-1" />

        {/* Show completed toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="show-completed"
            checked={showCompleted}
            onCheckedChange={setShowCompleted}
          />
          <Label htmlFor="show-completed" className="text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
            Terminées
          </Label>
        </div>
      </div>

      {/* Show completed toggle — tablet only (sm to lg) */}
      <div className="hidden sm:flex lg:hidden items-center gap-2">
        <Switch
          id="show-completed-tablet"
          checked={showCompleted}
          onCheckedChange={setShowCompleted}
        />
        <Label htmlFor="show-completed-tablet" className="text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
          Terminées
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
