import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  createRecurringTask,
  updateRecurringTask,
  deleteRecurringTask,
  generateDueTasks,
} from '@/lib/actions/recurring-tasks'
import type {
  RecurringTask,
  CreateRecurringTaskInput,
  UpdateRecurringTaskInput,
} from '@/types/tasks'
import { taskKeys } from './tasks'
import { briefingKeys, taskStatsKeys } from './briefing'

// ─── Query Keys Factory ──────────────────────────────

export const recurringTaskKeys = {
  all: ['recurringTasks'] as const,
  lists: () => [...recurringTaskKeys.all, 'list'] as const,
  list: (filters?: { is_active?: boolean }) =>
    [...recurringTaskKeys.lists(), filters ?? {}] as const,
  details: () => [...recurringTaskKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurringTaskKeys.details(), id] as const,
}

// ─── Fetch Functions ─────────────────────────────────

async function fetchRecurringTasks(filters?: {
  is_active?: boolean
}): Promise<RecurringTask[]> {
  const supabase = createClient()

  let query = supabase
    .from('recurring_tasks')
    .select('*, project:projects(id, name, color, status)')
    .order('next_due_date', { ascending: true })

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data as RecurringTask[]) ?? []
}

// ─── Query Hooks ─────────────────────────────────────

export function useRecurringTasks(filters?: { is_active?: boolean }) {
  return useQuery({
    queryKey: recurringTaskKeys.list(filters),
    queryFn: () => fetchRecurringTasks(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ─── Mutation Hooks ──────────────────────────────────

export function useCreateRecurringTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRecurringTaskInput) => {
      const result = await createRecurringTask(input)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la création')
      }
      return result.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTaskKeys.lists() })
      toast.success('Tâche récurrente créée')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateRecurringTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateRecurringTaskInput) => {
      const result = await updateRecurringTask(input)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la mise à jour')
      }
      return result.data!
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: recurringTaskKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: recurringTaskKeys.detail(input.id),
      })
      toast.success('Tâche récurrente mise à jour')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteRecurringTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteRecurringTask(id)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la suppression')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTaskKeys.lists() })
      toast.success('Tâche récurrente supprimée')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useGenerateDueTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const result = await generateDueTasks()
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la génération')
      }
      return result.generated
    },
    onSuccess: (generated) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recurringTaskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: briefingKeys.all })
      queryClient.invalidateQueries({ queryKey: taskStatsKeys.all })
      if (generated && generated > 0) {
        toast.success(`${generated} tâche(s) générée(s)`)
      } else {
        toast.info('Aucune tâche à générer')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
