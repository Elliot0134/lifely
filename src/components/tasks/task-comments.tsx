'use client'

import { useState, useCallback, type KeyboardEvent } from 'react'
import { Bot, MessageSquare, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTaskComments, useCreateComment } from '@/lib/queries/comments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import type { TaskComment } from '@/types/tasks'

// ─── Props ──────────────────────────────────────────

interface TaskCommentsProps {
  taskId: string | null
}

// ─── Comment Item ───────────────────────────────────

function CommentItem({ comment }: { comment: TaskComment }) {
  const isUser = comment.author_type === 'user'

  return (
    <div className="flex gap-3 py-3">
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          V
        </div>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? 'Vous' : 'Claude'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────

function CommentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ────────────────────────────────────

function CommentsEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
      <MessageSquare className="h-8 w-8" />
      <p className="text-sm">Aucun commentaire</p>
    </div>
  )
}

// ─── Comment Input ──────────────────────────────────

function CommentInputArea({ taskId }: { taskId: string }) {
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
    <div className="flex gap-2 pt-3 border-t">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ajouter un commentaire..."
        className="min-h-[60px] resize-none"
        rows={2}
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

// ─── Main Component ─────────────────────────────────

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { data: comments, isLoading, error } = useTaskComments(taskId ?? '')

  if (!taskId) return null

  return (
    <div className="space-y-2">
      {isLoading ? (
        <CommentsSkeleton />
      ) : error ? (
        <p className="text-sm text-destructive">
          Erreur lors du chargement des commentaires.
        </p>
      ) : !comments || comments.length === 0 ? (
        <CommentsEmpty />
      ) : (
        <div className="divide-y">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
      <CommentInputArea taskId={taskId} />
    </div>
  )
}
