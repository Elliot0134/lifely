'use client'

import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Pin,
  MoreHorizontal,
  Trash2,
  Building2,
  FolderKanban,
  CheckSquare,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { Note } from '@/types/tasks'

const ENTITY_ICONS = {
  task: CheckSquare,
  project: FolderKanban,
  company: Building2,
  personal: User,
} as const

const ENTITY_LABELS = {
  task: 'Tâche',
  project: 'Projet',
  company: 'Entreprise',
  personal: 'Perso',
} as const

const NOTE_COLORS: Record<string, string> = {
  red: 'border-l-red-500 bg-red-500/5',
  orange: 'border-l-orange-500 bg-orange-500/5',
  yellow: 'border-l-yellow-500 bg-yellow-500/5',
  green: 'border-l-green-500 bg-green-500/5',
  blue: 'border-l-blue-500 bg-blue-500/5',
  purple: 'border-l-purple-500 bg-purple-500/5',
  pink: 'border-l-pink-500 bg-pink-500/5',
}

interface NoteCardProps {
  note: Note
  onClick: () => void
  onDelete: () => void
  onTogglePin: () => void
}

function getContentPreview(content: Record<string, unknown> | null): string {
  if (!content) return ''
  try {
    const extractText = (node: Record<string, unknown>): string => {
      if (node.text) return node.text as string
      if (node.content && Array.isArray(node.content)) {
        return (node.content as Record<string, unknown>[])
          .map(extractText)
          .join(' ')
      }
      return ''
    }
    return extractText(content).slice(0, 200)
  } catch {
    return ''
  }
}

export function NoteCard({ note, onClick, onDelete, onTogglePin }: NoteCardProps) {
  const EntityIcon = ENTITY_ICONS[note.entity_type]
  const preview = getContentPreview(note.content)
  const colorClass = note.color ? NOTE_COLORS[note.color] : ''

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer flex-col rounded-lg border border-l-4 p-4 transition-all hover:shadow-md',
        colorClass || 'border-l-transparent'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight truncate">
            {note.title || 'Sans titre'}
          </h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-7 w-7 p-0', note.is_pinned && 'opacity-100')}
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin()
            }}
            aria-label={note.is_pinned ? 'Désépingler' : 'Épingler'}
          >
            <Pin className={cn('h-3.5 w-3.5', note.is_pinned && 'fill-current')} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {note.is_pinned && (
          <Pin className="h-3.5 w-3.5 fill-current text-muted-foreground group-hover:hidden" />
        )}
      </div>

      {/* Preview */}
      {preview && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
          {preview}
        </p>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1 text-xs">
            <EntityIcon className="h-3 w-3" />
            {ENTITY_LABELS[note.entity_type]}
          </Badge>
          {note.tags?.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-xs"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
          {note.tags && note.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(note.updated_at), {
            addSuffix: true,
            locale: fr,
          })}
        </span>
      </div>
    </div>
  )
}
