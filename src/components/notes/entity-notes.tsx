'use client'

import { useState } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoteCard } from '@/components/notes/note-card'
import { NoteModal } from '@/components/notes/note-modal'
import { useEntityNotes, useDeleteNote, useToggleNotePin } from '@/lib/queries/notes'
import type { Note, NoteEntityType } from '@/types/tasks'

interface EntityNotesProps {
  entityType: NoteEntityType
  entityId: string
}

export function EntityNotes({ entityType, entityId }: EntityNotesProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  const { data: notes = [], isLoading } = useEntityNotes(entityType, entityId)
  const deleteNote = useDeleteNote()
  const togglePin = useToggleNotePin()

  const handleCreate = () => {
    setEditingNote(null)
    setModalOpen(true)
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Notes ({notes.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={handleCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucune note associée
          </p>
          <Button variant="link" size="sm" onClick={handleCreate} className="mt-1">
            Créer une note
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => handleEdit(note)}
              onDelete={() => deleteNote.mutate(note.id)}
              onTogglePin={() =>
                togglePin.mutate({ id: note.id, is_pinned: !note.is_pinned })
              }
            />
          ))}
        </div>
      )}

      <NoteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        note={editingNote}
        defaultEntityType={entityType}
        defaultEntityId={entityId}
      />
    </div>
  )
}
