import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '@/lib/actions/comments'
import type { TaskComment, CreateCommentInput } from '@/types/tasks'
import { taskKeys } from './tasks'

// ─── Query Keys Factory ──────────────────────────────

export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (taskId: string) => [...commentKeys.lists(), taskId] as const,
}

// ─── Query Hooks ─────────────────────────────────────

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: commentKeys.list(taskId),
    queryFn: async (): Promise<TaskComment[]> => {
      const result = await getComments(taskId)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la récupération des commentaires')
      }
      return result.data as TaskComment[]
    },
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// ─── Mutation Hooks ──────────────────────────────────

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      const result = await createComment(input)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la création du commentaire')
      }
      return result.data!
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(data.task_id),
      })
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(data.task_id),
      })
      toast.success('Commentaire ajouté')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      content,
      taskId,
    }: {
      id: string
      content: string
      taskId: string
    }) => {
      const result = await updateComment(id, content)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la mise à jour du commentaire')
      }
      return { ...result.data!, taskId }
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(taskId),
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const result = await deleteComment(id)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la suppression du commentaire')
      }
      return { taskId }
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(taskId),
      })
      toast.success('Commentaire supprimé')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
