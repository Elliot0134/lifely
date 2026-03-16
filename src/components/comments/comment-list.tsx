'use client'

import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTaskComments } from '@/lib/queries/comments'
import { Skeleton } from '@/components/ui/skeleton'
import type { TaskComment } from '@/types/tasks'

interface CommentListProps {
  taskId: string
}

function CommentItem({ comment }: { comment: TaskComment }) {
  const isUser = comment.author_type === 'user'

  return (
    <div className="flex gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
        {isUser ? '\u{1F464}' : '\u{1F916}'}
      </div>
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

function CommentListSkeleton() {
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

export function CommentList({ taskId }: CommentListProps) {
  const { data: comments, isLoading, error } = useTaskComments(taskId)

  if (isLoading) {
    return <CommentListSkeleton />
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Erreur lors du chargement des commentaires.
      </p>
    )
  }

  if (!comments || comments.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Aucun commentaire
      </p>
    )
  }

  return (
    <div className="divide-y">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  )
}
