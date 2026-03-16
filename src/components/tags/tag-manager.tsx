"use client"

import * as React from "react"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/lib/queries/tags"
import { TAG_COLORS } from "@/lib/constants"
import { TagBadge } from "./tag-badge"
import type { Tag } from "@/types/tasks"

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TAG_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            "size-6 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === color ? "border-foreground scale-110" : "border-transparent"
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          aria-label={`Couleur ${color}`}
        />
      ))}
    </div>
  )
}

function TagRow({
  tag,
  onEdit,
  onDelete,
}: {
  tag: Tag
  onEdit: (tag: Tag) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors">
      <TagBadge tag={tag} />
      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => onEdit(tag)}
          aria-label={`Modifier le tag ${tag.name}`}
        >
          <Pencil className="size-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              aria-label={`Supprimer le tag ${tag.name}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le tag</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le tag &quot;{tag.name}&quot; ? Il
                sera retiré de toutes les tâches associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(tag.id)}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export function TagManager() {
  const { data: tags = [], isLoading } = useTags()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()

  // Add form state
  const [newName, setNewName] = React.useState("")
  const [newColor, setNewColor] = React.useState<string>(TAG_COLORS[0])
  const [showAddForm, setShowAddForm] = React.useState(false)

  // Edit state
  const [editingTag, setEditingTag] = React.useState<Tag | null>(null)
  const [editName, setEditName] = React.useState("")
  const [editColor, setEditColor] = React.useState("")

  function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) return

    createTag.mutate(
      { name: trimmed, color: newColor },
      {
        onSuccess: () => {
          setNewName("")
          setNewColor(TAG_COLORS[0])
          setShowAddForm(false)
        },
      }
    )
  }

  function startEdit(tag: Tag) {
    setEditingTag(tag)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  function handleUpdate() {
    if (!editingTag) return
    const trimmed = editName.trim()
    if (!trimmed) return

    updateTag.mutate(
      { id: editingTag.id, name: trimmed, color: editColor },
      {
        onSuccess: () => setEditingTag(null),
      }
    )
  }

  function handleDelete(id: string) {
    deleteTag.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Tag list */}
      <div className="space-y-0.5">
        {tags.length === 0 && !showAddForm && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucun tag créé. Ajoutez-en un pour organiser vos tâches.
          </p>
        )}
        {tags.map((tag: Tag) =>
          editingTag?.id === tag.id ? (
            <div key={tag.id} className="space-y-2 rounded-md border p-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nom du tag"
                className="h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate()
                  if (e.key === "Escape") setEditingTag(null)
                }}
              />
              <ColorPicker value={editColor} onChange={setEditColor} />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={!editName.trim() || updateTag.isPending}
                  className="h-7"
                >
                  <Check className="mr-1 size-3.5" />
                  Enregistrer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingTag(null)}
                  className="h-7"
                >
                  <X className="mr-1 size-3.5" />
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <TagRow key={tag.id} tag={tag} onEdit={startEdit} onDelete={handleDelete} />
          )
        )}
      </div>

      {/* Add form */}
      {showAddForm ? (
        <div className="space-y-2 rounded-md border p-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom du tag"
            className="h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
              if (e.key === "Escape") {
                setShowAddForm(false)
                setNewName("")
              }
            }}
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newName.trim() || createTag.isPending}
              className="h-7"
            >
              <Plus className="mr-1 size-3.5" />
              Ajouter
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddForm(false)
                setNewName("")
              }}
              className="h-7"
            >
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="w-full"
        >
          <Plus className="mr-1 size-4" />
          Ajouter un tag
        </Button>
      )}
    </div>
  )
}
