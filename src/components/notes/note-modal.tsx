'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  FolderKanban,
  CheckSquare,
  User,
  Pin,
  Palette,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { NoteEditor } from '@/components/notes/note-editor'
import { createNoteSchema } from '@/lib/validations/notes'
import { useCreateNote, useUpdateNote } from '@/lib/queries/notes'
import { useTags } from '@/lib/queries/tags'
import { cn } from '@/lib/utils'
import type { Note, NoteEntityType, Tag } from '@/types/tasks'

const ENTITY_OPTIONS = [
  { value: 'personal', label: 'Perso', icon: User },
  { value: 'task', label: 'Tâche', icon: CheckSquare },
  { value: 'project', label: 'Projet', icon: FolderKanban },
  { value: 'company', label: 'Entreprise', icon: Building2 },
] as const

const NOTE_COLORS = [
  { value: 'red', label: 'Rouge', class: 'bg-red-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'yellow', label: 'Jaune', class: 'bg-yellow-500' },
  { value: 'green', label: 'Vert', class: 'bg-green-500' },
  { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { value: 'pink', label: 'Rose', class: 'bg-pink-500' },
]

interface NoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note?: Note | null
  defaultEntityType?: NoteEntityType
  defaultEntityId?: string
}

export function NoteModal({
  open,
  onOpenChange,
  note,
  defaultEntityType = 'personal',
  defaultEntityId,
}: NoteModalProps) {
  const isEditing = !!note
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const { data: tags = [] } = useTags()

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [editorContent, setEditorContent] = useState<Record<string, unknown> | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [isPinned, setIsPinned] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: '',
      entity_type: defaultEntityType,
      entity_id: defaultEntityId,
    },
  })

  useEffect(() => {
    if (note) {
      reset({
        title: note.title,
        entity_type: note.entity_type,
        entity_id: note.entity_id ?? undefined,
      })
      setEditorContent(note.content)
      setSelectedTagIds(note.tags?.map((t) => t.id) ?? [])
      setSelectedColor(note.color)
      setIsPinned(note.is_pinned)
    } else {
      reset({
        title: '',
        entity_type: defaultEntityType,
        entity_id: defaultEntityId,
      })
      setEditorContent(null)
      setSelectedTagIds([])
      setSelectedColor(null)
      setIsPinned(false)
    }
  }, [note, open, reset, defaultEntityType, defaultEntityId])

  const entityType = watch('entity_type')

  const onSubmit = async (data: Record<string, unknown>) => {
    const payload = {
      title: data.title as string,
      entity_type: data.entity_type as NoteEntityType,
      entity_id: (data.entity_type === 'personal' ? undefined : data.entity_id) as string | undefined,
      content: editorContent ?? {},
      color: selectedColor ?? undefined,
      is_pinned: isPinned,
      tag_ids: selectedTagIds,
    }

    if (isEditing && note) {
      await updateNote.mutateAsync({ id: note.id, ...payload })
    } else {
      await createNote.mutateAsync(payload)
    }

    onOpenChange(false)
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la note' : 'Nouvelle note'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              placeholder="Titre de la note..."
              {...register('title')}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Entity Type + Color + Pin */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2 flex-1 min-w-[150px]">
              <Label>Associer à</Label>
              <Select
                value={entityType}
                onValueChange={(v) => setValue('entity_type', v as NoteEntityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Palette className="h-4 w-4" />
                  {selectedColor ? (
                    <div
                      className={cn(
                        'h-3 w-3 rounded-full',
                        NOTE_COLORS.find((c) => c.value === selectedColor)?.class
                      )}
                    />
                  ) : (
                    'Couleur'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className={cn(
                      'h-6 w-6 rounded-full border-2 bg-background',
                      !selectedColor && 'border-foreground'
                    )}
                    onClick={() => setSelectedColor(null)}
                    aria-label="Sans couleur"
                  />
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={cn(
                        'h-6 w-6 rounded-full border-2',
                        color.class,
                        selectedColor === color.value
                          ? 'border-foreground'
                          : 'border-transparent'
                      )}
                      onClick={() => setSelectedColor(color.value)}
                      aria-label={color.label}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              variant={isPinned ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => setIsPinned(!isPinned)}
            >
              <Pin className={cn('h-4 w-4', isPinned && 'fill-current')} />
              {isPinned ? 'Épinglé' : 'Épingler'}
            </Button>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag: Tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    style={
                      selectedTagIds.includes(tag.id)
                        ? { backgroundColor: tag.color, borderColor: tag.color }
                        : { borderColor: tag.color, color: tag.color }
                    }
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Editor */}
          <div className="space-y-2">
            <Label>Contenu</Label>
            <NoteEditor
              content={editorContent}
              onChange={setEditorContent}
              autoFocus={false}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createNote.isPending || updateNote.isPending}
            >
              {createNote.isPending || updateNote.isPending
                ? 'Enregistrement...'
                : isEditing
                ? 'Mettre à jour'
                : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
