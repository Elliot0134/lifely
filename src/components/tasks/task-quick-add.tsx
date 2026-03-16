'use client'

import { useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { useCreateTask } from '@/lib/queries/tasks'

interface TaskQuickAddProps {
  project_id?: string
  parent_task_id?: string
  className?: string
}

export function TaskQuickAdd({
  project_id,
  parent_task_id,
  className,
}: TaskQuickAddProps) {
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const createMutation = useCreateTask()

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const trimmed = title.trim()
    if (!trimmed) return

    try {
      await createMutation.mutateAsync({
        title: trimmed,
        ...(project_id && { project_id }),
        ...(parent_task_id && { parent_task_id }),
      })
      setTitle('')
      inputRef.current?.focus()
    } catch {
      // Error handled by mutation onError (toast)
    }
  }

  return (
    <div className={className}>
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Ajouter une tâche..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={createMutation.isPending}
          aria-label="Ajouter une tâche rapidement"
        />
        {createMutation.isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}
