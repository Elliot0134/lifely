'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { NoteToolbar } from '@/components/notes/note-toolbar'
import { NoteCard } from '@/components/notes/note-card'
import { NoteModal } from '@/components/notes/note-modal'
import { useNotes, useDeleteNote, useToggleNotePin } from '@/lib/queries/notes'
import type { Note, NoteFilters } from '@/types/tasks'

export default function NotesPage() {
  const [filters, setFilters] = useState<NoteFilters>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  const { data: notes = [], isLoading } = useNotes(filters)
  const deleteNote = useDeleteNote()
  const togglePin = useToggleNotePin()

  const handleCreateNote = () => {
    setEditingNote(null)
    setModalOpen(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setModalOpen(true)
  }

  const handleDeleteNote = (id: string) => {
    deleteNote.mutate(id)
  }

  const handleTogglePin = (note: Note) => {
    togglePin.mutate({ id: note.id, is_pinned: !note.is_pinned })
  }

  const pinnedNotes = notes.filter((n) => n.is_pinned)
  const unpinnedNotes = notes.filter((n) => !n.is_pinned)

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <NoteToolbar
        filters={filters}
        onFiltersChange={setFilters}
        onCreateNote={handleCreateNote}
        noteCount={notes.length}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <BookOpen className="size-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Aucune note</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Créez votre première note pour commencer.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Épinglées
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => handleEditNote(note)}
                    onDelete={() => handleDeleteNote(note.id)}
                    onTogglePin={() => handleTogglePin(note)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All notes */}
          {unpinnedNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Autres
                </h2>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unpinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => handleEditNote(note)}
                    onDelete={() => handleDeleteNote(note.id)}
                    onTogglePin={() => handleTogglePin(note)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <NoteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        note={editingNote}
      />
    </div>
  )
}
