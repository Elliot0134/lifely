'use client'

import { useState, useCallback, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { useCreateComment } from '@/lib/queries/comments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CommentInputProps {
  taskId: string
}

export function CommentInput({ taskId }: CommentInputProps) {
  const [content, setContent] = useState('')
  const createComment = useCreateComment()

  const handleSubmit = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed) return

    createComment.mutate(
      {
        task_id: taskId,
        content: trimmed,
        author_type: 'user',
      },
      {
        onSuccess: () => {
          setContent('')
        },
      }
    )
  }, [content, taskId, createComment])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className="flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ajouter un commentaire..."
        className="min-h-[40px] resize-none"
        rows={1}
        disabled={createComment.isPending}
      />
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={!content.trim() || createComment.isPending}
        aria-label="Envoyer le commentaire"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
