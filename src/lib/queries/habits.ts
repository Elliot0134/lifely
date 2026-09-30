import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addDays, endOfMonth, format } from 'date-fns'
import { toast } from 'sonner'
import {
  archiveHabit,
  createHabit,
  deleteHabit,
  reorderHabits,
  toggleCompletion,
  updateHabit,
} from '@/lib/actions/habits'
import { createClient } from '@/lib/supabase/client'
import type { HabitFormInput } from '@/lib/validations/habit'
import type { Habit, HabitCompletion } from '@/types/habit'

// ─── Query Keys Factory ──────────────────────────────

export const habitKeys = {
  all: ['habits'] as const,
  lists: () => [...habitKeys.all, 'list'] as const,
  list: () => [...habitKeys.lists()] as const,
  week: (weekStartISO: string) =>
    [...habitKeys.all, 'week', weekStartISO] as const,
  month: (monthStartISO: string) =>
    [...habitKeys.all, 'month', monthStartISO] as const,
  details: () => [...habitKeys.all, 'detail'] as const,
  detail: (id: string) => [...habitKeys.details(), id] as const,
}

// ─── Fetch Functions (Supabase browser client) ───────

async function fetchHabits(): Promise<Habit[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .is('archived_at', null)
    .order('order_index', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as Habit[]) ?? []
}

async function fetchWeekHabitCompletions(
  weekStart: string,
): Promise<HabitCompletion[]> {
  const supabase = createClient()

  const weekEndDate = addDays(new Date(weekStart), 6)
  const weekEnd = format(weekEndDate, 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .gte('completed_date', weekStart)
    .lte('completed_date', weekEnd)

  if (error) {
    throw new Error(error.message)
  }

  return (data as HabitCompletion[]) ?? []
}

async function fetchMonthHabitCompletions(
  monthStart: string,
): Promise<HabitCompletion[]> {
  const supabase = createClient()

  const monthEndDate = endOfMonth(new Date(monthStart))
  const monthEnd = format(monthEndDate, 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .gte('completed_date', monthStart)
    .lte('completed_date', monthEnd)

  if (error) {
    throw new Error(error.message)
  }

  return (data as HabitCompletion[]) ?? []
}

// ─── Query Hooks ─────────────────────────────────────

export function useHabits() {
  return useQuery({
    queryKey: habitKeys.list(),
    queryFn: fetchHabits,
    staleTime: 60_000,
  })
}

export function useWeekHabitCompletions(weekStart: string) {
  return useQuery({
    queryKey: habitKeys.week(weekStart),
    queryFn: () => fetchWeekHabitCompletions(weekStart),
    enabled: !!weekStart,
    staleTime: 60_000,
  })
}

export function useMonthHabitCompletions(monthStart: string) {
  return useQuery({
    queryKey: habitKeys.month(monthStart),
    queryFn: () => fetchMonthHabitCompletions(monthStart),
    enabled: !!monthStart,
    staleTime: 60_000,
  })
}

// ─── Mutation Hooks ──────────────────────────────────

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: HabitFormInput) => {
      const result = await createHabit(input)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la création')
      }
      return result.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() })
      toast.success('Habitude créée')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      data: Partial<HabitFormInput>
    }) => {
      const result = await updateHabit(input.id, input.data)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la mise à jour')
      }
      return result.data!
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() })
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(input.id) })
      toast.success('Habitude mise à jour')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useArchiveHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await archiveHabit(id)
      if (!result.success) {
        throw new Error(result.error ?? "Erreur lors de l'archivage")
      }
      return result.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all })
      toast.success('Habitude archivée')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteHabit(id)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la suppression')
      }
      return result.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all })
      toast.success('Habitude supprimée')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// ─── Optimistic Reorder Habits ───────────────────────

type ReorderContext = {
  previousList: Habit[] | undefined
}

export function useReorderHabits() {
  const queryClient = useQueryClient()

  return useMutation<{ count: number }, Error, string[], ReorderContext>({
    mutationFn: async (orderedIds: string[]) => {
      const result = await reorderHabits(orderedIds)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors du réordonnement')
      }
      return result.data!
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.lists() })

      const previousList = queryClient.getQueryData<Habit[]>(habitKeys.list())

      queryClient.setQueryData<Habit[] | undefined>(
        habitKeys.list(),
        (prev) => {
          if (!prev) return prev
          const byId = new Map(prev.map((h) => [h.id, h]))
          const reordered = orderedIds
            .map((id) => byId.get(id))
            .filter((h): h is Habit => Boolean(h))
          // Append any habits not present in orderedIds (defensive: shouldn't happen)
          const reorderedIds = new Set(orderedIds)
          const remaining = prev.filter((h) => !reorderedIds.has(h.id))
          return [...reordered, ...remaining]
        },
      )

      return { previousList }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        queryClient.setQueryData<Habit[]>(habitKeys.list(), context.previousList)
      }
      toast.error('Erreur lors du réordonnement')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() })
    },
  })
}

// ─── Optimistic Toggle Completion ────────────────────

type ToggleCompletionVars = { habitId: string; date: string }

type CompletionsSnapshot = Array<{
  queryKey: readonly unknown[]
  data: HabitCompletion[] | undefined
}>

type ToggleContext = {
  previousWeeks: CompletionsSnapshot
  previousMonths: CompletionsSnapshot
}

export function useToggleCompletion() {
  const queryClient = useQueryClient()

  return useMutation<
    { completed: boolean },
    Error,
    ToggleCompletionVars,
    ToggleContext
  >({
    mutationFn: async ({ habitId, date }) => {
      const result = await toggleCompletion(habitId, date)
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la mise à jour')
      }
      return result.data!
    },
    onMutate: async ({ habitId, date }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: habitKeys.all })

      const weekQueries = queryClient.getQueriesData<HabitCompletion[]>({
        queryKey: [...habitKeys.all, 'week'],
      })
      const monthQueries = queryClient.getQueriesData<HabitCompletion[]>({
        queryKey: [...habitKeys.all, 'month'],
      })

      const previousWeeks: CompletionsSnapshot = weekQueries.map(
        ([queryKey, data]) => ({ queryKey, data })
      )
      const previousMonths: CompletionsSnapshot = monthQueries.map(
        ([queryKey, data]) => ({ queryKey, data })
      )

      const applyToggle = (
        current: HabitCompletion[] | undefined
      ): HabitCompletion[] | undefined => {
        if (!current) return current

        const existing = current.filter(
          (c) => c.habit_id === habitId && c.completed_date === date
        )

        if (existing.length > 0) {
          // Remove all matching rows (defensive: handles potential duplicates)
          return current.filter(
            (c) => !(c.habit_id === habitId && c.completed_date === date)
          )
        }

        // Append synthetic optimistic row
        const optimisticRow: HabitCompletion = {
          id: `optimistic-${crypto.randomUUID()}`,
          habit_id: habitId,
          user_id: '',
          completed_date: date,
          created_at: new Date().toISOString(),
        }
        return [...current, optimisticRow]
      }

      for (const [queryKey, data] of weekQueries) {
        queryClient.setQueryData<HabitCompletion[]>(queryKey, applyToggle(data))
      }
      for (const [queryKey, data] of monthQueries) {
        queryClient.setQueryData<HabitCompletion[]>(queryKey, applyToggle(data))
      }

      return { previousWeeks, previousMonths }
    },
    onError: (_err, _vars, context) => {
      // Rollback to snapshots
      if (context?.previousWeeks) {
        for (const { queryKey, data } of context.previousWeeks) {
          queryClient.setQueryData<HabitCompletion[] | undefined>(
            queryKey,
            data
          )
        }
      }
      if (context?.previousMonths) {
        for (const { queryKey, data } of context.previousMonths) {
          queryClient.setQueryData<HabitCompletion[] | undefined>(
            queryKey,
            data
          )
        }
      }
      toast.error('Erreur lors de la mise à jour')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all })
    },
  })
}
