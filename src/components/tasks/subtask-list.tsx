"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSubtasks, useUpdateTaskStatus, useCreateTask, taskKeys } from "@/lib/queries/tasks"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

// ─── Props ──────────────────────────────────────────────

interface SubtaskListProps {
  parentTaskId: string
  className?: string
}

// ─── Component ──────────────────────────────────────────

export function SubtaskList({ parentTaskId, className }: SubtaskListProps) {
  const queryClient = useQueryClient()
  const { data: subtasks = [], isLoading } = useSubtasks(parentTaskId)
  const updateStatus = useUpdateTaskStatus()
  const createTask = useCreateTask()

  const [newTitle, setNewTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const completedCount = subtasks.filter((t) => t.status === "completed").length
  const totalCount = subtasks.length
  const progressValue = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleToggle = (subtask: { id: string; status: string }) => {
    updateStatus.mutate(
      { id: subtask.id, status: subtask.status === "completed" ? "todo" : "completed" },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: taskKeys.subtasks(parentTaskId) })
        },
      }
    )
  }

  const handleCreate = () => {
    const title = newTitle.trim()
    if (!title) return

    createTask.mutate(
      { title, parent_task_id: parentTaskId },
      {
        onSuccess: () => {
          setNewTitle("")
          queryClient.invalidateQueries({ queryKey: taskKeys.subtasks(parentTaskId) })
          inputRef.current?.focus()
        },
      }
    )
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreate()
    }
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-2 pl-6", className)}>
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-3 pl-6", className)}>
      {/* Progress indicator */}
      {totalCount > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground font-medium">
            {completedCount}/{totalCount} sous-tâches
          </span>
          <Progress value={progressValue} className="h-1.5" />
        </div>
      )}

      {/* Subtask items */}
      {subtasks.map((subtask) => (
        <div
          key={subtask.id}
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50"
        >
          <Checkbox
            checked={subtask.status === "completed"}
            onCheckedChange={() => handleToggle(subtask)}
            aria-label={`Marquer "${subtask.title}" comme ${subtask.status === "completed" ? "non complétée" : "complétée"}`}
          />
          <span
            className={cn(
              "text-sm leading-tight",
              subtask.status === "completed" && "line-through text-muted-foreground"
            )}
          >
            {subtask.title}
          </span>
        </div>
      ))}

      {/* Inline add input */}
      <div className="flex items-center gap-2.5 px-2">
        <Plus className="size-4 shrink-0 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ajouter une sous-tâche..."
          disabled={createTask.isPending}
          className="h-8 border-none bg-transparent px-0 text-sm shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
        />
      </div>
    </div>
  )
}
