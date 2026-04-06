'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  Building2,
  FolderKanban,
  CheckSquare,
  User,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import type { NoteEntityType, NoteFilters } from '@/types/tasks'

const ENTITY_FILTERS: { value: NoteEntityType; label: string; icon: typeof User }[] = [
  { value: 'personal', label: 'Perso', icon: User },
  { value: 'task', label: 'Tâches', icon: CheckSquare },
  { value: 'project', label: 'Projets', icon: FolderKanban },
  { value: 'company', label: 'Entreprises', icon: Building2 },
]

interface NoteToolbarProps {
  filters: NoteFilters
  onFiltersChange: (filters: NoteFilters) => void
  onCreateNote: () => void
  noteCount?: number
}

export function NoteToolbar({
  filters,
  onFiltersChange,
  onCreateNote,
  noteCount,
}: NoteToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(!!filters.search)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
          {noteCount !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {noteCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Rechercher"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button onClick={onCreateNote} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle note</span>
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <Input
          placeholder="Rechercher dans les notes..."
          value={filters.search ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value || undefined })
          }
          className="max-w-sm"
          autoFocus
        />
      )}

      {/* Entity type filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Toggle
          size="sm"
          pressed={!filters.entity_type}
          onPressedChange={() =>
            onFiltersChange({ ...filters, entity_type: undefined })
          }
        >
          Toutes
        </Toggle>
        {ENTITY_FILTERS.map((filter) => (
          <Toggle
            key={filter.value}
            size="sm"
            pressed={filters.entity_type === filter.value}
            onPressedChange={() =>
              onFiltersChange({
                ...filters,
                entity_type:
                  filters.entity_type === filter.value
                    ? undefined
                    : filter.value,
              })
            }
          >
            <filter.icon className="mr-1.5 h-3.5 w-3.5" />
            {filter.label}
          </Toggle>
        ))}

        <Toggle
          size="sm"
          pressed={filters.is_pinned === true}
          onPressedChange={() =>
            onFiltersChange({
              ...filters,
              is_pinned: filters.is_pinned ? undefined : true,
            })
          }
        >
          Épinglées
        </Toggle>
      </div>
    </div>
  )
}
