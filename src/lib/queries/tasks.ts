import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  reorderTasks,
  scheduleTask,
  unscheduleTask,
} from '@/lib/actions/tasks'
import type {
  Task,
  TaskFilters,
  CreateTaskInput,
  UpdateTaskInput,
} from '@/types/tasks'

// ─── Query Keys Factory ──────────────────────────────

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  subtasks: (parentId: string) =>
    [...taskKeys.all, 'subtasks', parentId] as const,
  scheduled: (date: string) =>
    [...taskKeys.all, 'scheduled', date] as const,
}

// ─── Fetch Functions (Supabase browser client) ───────

async function fetchTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const supabase = createClient()

  let query = supabase
    .from('task_details')
    .select('*')

  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id)
  }
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id)
  }
  if (filters.is_completed !== undefined) {
    query = query.eq('is_completed', filters.is_completed)
  }
  if (filters.is_code_task !== undefined) {
    query = query.eq('is_code_task', filters.is_code_task)
  }
  if (filters.urgency) {
    query = query.eq('urgency', filters.urgency)
  }
  if (filters.due_status) {
    query = query.eq('due_status', filters.due_status)
  }
  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }
  if (filters.parent_task_id !== undefined) {
    if (filters.parent_task_id === null) {
      query = query.is('parent_task_id', null)
    } else {
      query = query.eq('parent_task_id', filters.parent_task_id)
    }
  }
  if (filters.scheduled_date) {
    query = query.eq('scheduled_date', filters.scheduled_date)
  }

  query = query.order('sort_order', { ascending: true })

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data as Task[]) ?? []
}

async function fetchTask(id: string): Promise<Task> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('task_details')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Task
}

async function fetchSubtasks(parentId: string): Promise<Task[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('task_details')
    .select('*')
    .eq('parent_task_id', parentId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as Task[]) ?? []
}

async function fetchScheduledTasks(date: string): Promise<Task[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('task_details')
    .select('*')
    .eq('scheduled_date', date)
    .order('scheduled_start_time', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as Task[]) ?? []
}

// ─── Query Hooks ─────────────────────────────────────

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => fetchTasks(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => fetchTask(id),
    enabled: !!id,
  })
}

export function useSubtasks(parentId: string) {
  return useQuery({
    queryKey: taskKeys.subtasks(parentId),
    queryFn: () => fetchSubtasks(parentId),
    enabled: !!parentId,
  })
}

export function useScheduledTasks(date: string) {
  return useQuery({
    queryKey: taskKeys.scheduled(date),
    queryFn: () => fetchScheduledTasks(date),
    enabled: !!date,
  })
}

// ─── Mutation Hooks ──────────────────────────────────

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const result = await createTask(input)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la création')
      }
      return result.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['briefing'] })
      queryClient.invalidateQueries({ queryKey: ['taskStats'] })
      toast.success('Tâche créée avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const result = await updateTask(input)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la mise à jour')
      }
      return result.data!
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(input.id) })
      queryClient.invalidateQueries({ queryKey: ['briefing'] })
      queryClient.invalidateQueries({ queryKey: ['taskStats'] })
      toast.success('Tâche mise à jour')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTask(id)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la suppression')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['briefing'] })
      queryClient.invalidateQueries({ queryKey: ['taskStats'] })
      toast.success('Tâche supprimée')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useToggleTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await toggleTask(id)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors du toggle')
      }
      return result.data!
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: ['briefing'] })
      queryClient.invalidateQueries({ queryKey: ['taskStats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useReorderTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const result = await reorderTasks(items)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors du réordonnancement')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useScheduleTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      scheduled_date: string
      scheduled_start_time: string
      scheduled_end_time: string
    }) => {
      const result = await scheduleTask(input)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la planification')
      }
      return result.data!
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: ['briefing'] })
      toast.success('Tâche planifiée')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUnscheduleTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await unscheduleTask(id)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la déplanification')
      }
      return result.data!
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: ['briefing'] })
      toast.success('Planification retirée')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
