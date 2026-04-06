import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  createNote,
  updateNote,
  deleteNote,
  toggleNotePin,
} from '@/lib/actions/notes'
import type {
  Note,
  NoteFilters,
  CreateNoteInput,
  UpdateNoteInput,
  Tag,
} from '@/types/tasks'

// ─── Query Keys Factory ──────────────────────────────

export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters: NoteFilters) => [...noteKeys.lists(), filters] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
  entity: (entityType: string, entityId: string) =>
    [...noteKeys.all, 'entity', entityType, entityId] as const,
}

// ─── Fetch Functions ────────────────────────────────

async function fetchNotes(filters: NoteFilters = {}): Promise<Note[]> {
  const supabase = createClient()

  let query = supabase
    .from('notes')
    .select('*')

  if (filters.entity_type) {
    query = query.eq('entity_type', filters.entity_type)
  }
  if (filters.entity_id) {
    query = query.eq('entity_id', filters.entity_id)
  }
  if (filters.is_pinned !== undefined) {
    query = query.eq('is_pinned', filters.is_pinned)
  }
  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  query = query
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Fetch tags for all notes
  const noteIds = (data ?? []).map((n) => n.id)
  if (noteIds.length === 0) return []

  const { data: noteTags } = await supabase
    .from('note_tags')
    .select('note_id, tag_id')
    .in('note_id', noteIds)

  const tagIds = [...new Set((noteTags ?? []).map((nt) => nt.tag_id))]
  let tagsMap: Record<string, Tag> = {}

  if (tagIds.length > 0) {
    const { data: tags } = await supabase
      .from('tags')
      .select('*')
      .in('id', tagIds)

    tagsMap = (tags ?? []).reduce((acc, tag) => {
      acc[tag.id] = tag as Tag
      return acc
    }, {} as Record<string, Tag>)
  }

  // Map tags to notes
  const noteTagsMap: Record<string, Tag[]> = {}
  for (const nt of noteTags ?? []) {
    if (!noteTagsMap[nt.note_id]) noteTagsMap[nt.note_id] = []
    if (tagsMap[nt.tag_id]) noteTagsMap[nt.note_id].push(tagsMap[nt.tag_id])
  }

  return (data ?? []).map((note) => ({
    ...note,
    content: note.content as Record<string, unknown> | null,
    tags: noteTagsMap[note.id] ?? [],
  })) as Note[]
}

async function fetchNote(id: string): Promise<Note> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Fetch tags
  const { data: noteTags } = await supabase
    .from('note_tags')
    .select('tag_id')
    .eq('note_id', id)

  const tagIds = (noteTags ?? []).map((nt) => nt.tag_id)
  let tags: Tag[] = []

  if (tagIds.length > 0) {
    const { data: tagData } = await supabase
      .from('tags')
      .select('*')
      .in('id', tagIds)

    tags = (tagData ?? []) as Tag[]
  }

  return {
    ...data,
    content: data.content as Record<string, unknown> | null,
    tags,
  } as Note
}

async function fetchEntityNotes(entityType: string, entityId: string): Promise<Note[]> {
  return fetchNotes({ entity_type: entityType as Note['entity_type'], entity_id: entityId })
}

// ─── Query Hooks ─────────────────────────────────────

export function useNotes(filters: NoteFilters = {}) {
  return useQuery({
    queryKey: noteKeys.list(filters),
    queryFn: () => fetchNotes(filters),
    staleTime: 2 * 60 * 1000,
  })
}

export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => fetchNote(id),
    enabled: !!id,
  })
}

export function useEntityNotes(entityType: string, entityId: string) {
  return useQuery({
    queryKey: noteKeys.entity(entityType, entityId),
    queryFn: () => fetchEntityNotes(entityType, entityId),
    enabled: !!entityType && !!entityId,
  })
}

// ─── Mutation Hooks ──────────────────────────────────

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const result = await createNote(input)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la création')
      }
      return result.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      toast.success('Note créée')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateNoteInput) => {
      const result = await updateNote(input)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la mise à jour')
      }
      return result.data!
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(input.id) })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteNote(id)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la suppression')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      toast.success('Note supprimée')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useToggleNotePin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const result = await toggleNotePin(id, is_pinned)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de l\'épinglage')
      }
      return result.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
