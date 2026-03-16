import { useQuery } from '@tanstack/react-query'
import { getDailyBriefing, getTaskStats } from '@/lib/actions/briefing'
import type { DailyBriefing, TaskStats } from '@/types/tasks'

// ─── Query Keys Factory ──────────────────────────────

export const briefingKeys = {
  all: ['briefing'] as const,
  daily: () => [...briefingKeys.all, 'daily'] as const,
}

export const taskStatsKeys = {
  all: ['taskStats'] as const,
}

// ─── Query Hooks ─────────────────────────────────────

export function useDailyBriefing() {
  return useQuery({
    queryKey: briefingKeys.daily(),
    queryFn: async (): Promise<DailyBriefing> => {
      const result = await getDailyBriefing()
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Erreur lors de la récupération du briefing')
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useTaskStats() {
  return useQuery({
    queryKey: taskStatsKeys.all,
    queryFn: async (): Promise<TaskStats> => {
      const result = await getTaskStats()
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Erreur lors de la récupération des stats')
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
