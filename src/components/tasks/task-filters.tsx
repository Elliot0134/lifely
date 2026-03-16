'use client'

import { useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TagSelect } from '@/components/tags/tag-select'
import { useProjects } from '@/lib/queries/task-projects'
import { useTags } from '@/lib/queries/tags'
import { TASK_URGENCIES } from '@/lib/constants'
import type { TaskFilters, TaskUrgency, Tag } from '@/types/tasks'

// ─── Props ──────────────────────────────────────────────────

interface TaskFiltersBarProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
}

// ─── Active filter pill ─────────────────────────────────────

interface FilterPillProps {
  label: string
  onRemove: () => void
}

function FilterPill({ label, onRemove }: FilterPillProps) {
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

// ─── Component ──────────────────────────────────────────────

export function TaskFiltersBar({ filters, onFiltersChange }: TaskFiltersBarProps) {
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()

  // Compute active filter pills
  const activeFilters = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = []

    if (filters.project_id) {
      const project = projects.find((p) => p.id === filters.project_id)
      pills.push({
        key: 'project',
        label: `Projet: ${project?.name ?? 'Inconnu'}`,
        onRemove: () => onFiltersChange({ ...filters, project_id: undefined }),
      })
    }

    if (filters.urgency) {
      const urgency = TASK_URGENCIES.find((u) => u.value === filters.urgency)
      pills.push({
        key: 'urgency',
        label: `Urgence: ${urgency?.label ?? filters.urgency}`,
        onRemove: () => onFiltersChange({ ...filters, urgency: undefined }),
      })
    }

    if (filters.is_code_task !== undefined) {
      pills.push({
        key: 'type',
        label: `Type: ${filters.is_code_task ? 'Code' : 'Non-code'}`,
        onRemove: () => onFiltersChange({ ...filters, is_code_task: undefined }),
      })
    }

    if (filters.is_completed !== undefined) {
      pills.push({
        key: 'status',
        label: `Statut: ${filters.is_completed ? 'Terminées' : 'Actives'}`,
        onRemove: () => onFiltersChange({ ...filters, is_completed: undefined }),
      })
    }

    if (filters.tag_ids && filters.tag_ids.length > 0) {
      const tagNames = filters.tag_ids
        .map((id) => tags.find((t: Tag) => t.id === id)?.name ?? id)
        .join(', ')
      pills.push({
        key: 'tags',
        label: `Tags: ${tagNames}`,
        onRemove: () => onFiltersChange({ ...filters, tag_ids: undefined }),
      })
    }

    if (filters.search) {
      pills.push({
        key: 'search',
        label: `Recherche: "${filters.search}"`,
        onRemove: () => onFiltersChange({ ...filters, search: undefined }),
      })
    }

    return pills
  }, [filters, projects, tags, onFiltersChange])

  const hasActiveFilters = activeFilters.length > 0

  function clearAllFilters() {
    onFiltersChange({
      parent_task_id: filters.parent_task_id,
      scheduled_date: filters.scheduled_date,
    })
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={filters.search ?? ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                search: e.target.value || undefined,
              })
            }
            className="pl-9"
          />
        </div>

        {/* Project */}
        <Select
          value={filters.project_id ?? '_all'}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              project_id: v === '_all' ? undefined : v,
            })
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

        {/* Urgency */}
        <Select
          value={filters.urgency ?? '_all'}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              urgency: v === '_all' ? undefined : (v as TaskUrgency),
            })
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Urgence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Toutes urgences</SelectItem>
            {TASK_URGENCIES.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type (Code / Non-code / All) */}
        <Select
          value={
            filters.is_code_task === undefined
              ? '_all'
              : filters.is_code_task
                ? 'code'
                : 'non_code'
          }
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              is_code_task:
                v === '_all' ? undefined : v === 'code',
            })
          }
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tous types</SelectItem>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="non_code">Non-code</SelectItem>
          </SelectContent>
        </Select>

        {/* Status (Active / Completed / All) */}
        <Select
          value={
            filters.is_completed === undefined
              ? '_all'
              : filters.is_completed
                ? 'completed'
                : 'active'
          }
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              is_completed:
                v === '_all' ? undefined : v === 'completed',
            })
          }
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tous statuts</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="completed">Terminées</SelectItem>
          </SelectContent>
        </Select>

        {/* Tags */}
        <div className="w-full sm:w-56">
          <TagSelect
            value={filters.tag_ids ?? []}
            onChange={(ids) =>
              onFiltersChange({
                ...filters,
                tag_ids: ids.length > 0 ? ids : undefined,
              })
            }
          />
        </div>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {activeFilters.length} filtre{activeFilters.length > 1 ? 's' : ''} actif{activeFilters.length > 1 ? 's' : ''}
          </span>
          {activeFilters.map((pill) => (
            <FilterPill
              key={pill.key}
              label={pill.label}
              onRemove={pill.onRemove}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Effacer les filtres
          </Button>
        </div>
      )}
    </div>
  )
}
