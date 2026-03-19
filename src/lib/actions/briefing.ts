'use server'

import { createClient } from '@/lib/supabase/server'
import type { DailyBriefing, Task, TaskStats } from '@/types/tasks'

// ─── Helpers ─────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── getDailyBriefing ────────────────────────────────

export async function getDailyBriefing(): Promise<{
  success: boolean
  data?: DailyBriefing
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const today = new Date()
    const todayStr = toDateString(today)

    const upcoming3 = new Date(today)
    upcoming3.setDate(upcoming3.getDate() + 3)
    const upcoming3Str = toDateString(upcoming3)

    // Fetch all open tasks
    const { data: openTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*, project:projects(id, name, color, status)')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .order('due_date', { ascending: true, nullsFirst: false })

    if (tasksError) throw new Error(tasksError.message)

    // Fetch tasks completed today
    const { data: completedToday, error: completedError } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', `${todayStr}T00:00:00`)
      .lte('completed_at', `${todayStr}T23:59:59`)

    if (completedError) throw new Error(completedError.message)

    // Group tasks by due status
    const overdue: Task[] = []
    const todayTasks: Task[] = []
    const upcoming: Task[] = []
    const noDate: Task[] = []

    for (const task of (openTasks ?? []) as Task[]) {
      if (!task.due_date) {
        noDate.push(task)
      } else if (task.due_date < todayStr) {
        overdue.push(task)
      } else if (task.due_date === todayStr) {
        todayTasks.push(task)
      } else if (task.due_date <= upcoming3Str) {
        upcoming.push(task)
      }
      // future tasks are ignored for the briefing
    }

    // Active projects with remaining tasks
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description, status, color, start_date, end_date, company_id, user_id, created_at, updated_at')
      .eq('user_id', user.id)
      .in('status', ['not_started', 'in_progress'])

    if (projectsError) throw new Error(projectsError.message)

    // Count remaining tasks per project
    const activeProjects = (projects ?? []).map((project) => {
      const remaining = (openTasks ?? []).filter(
        (t) => t.project_id === project.id
      ).length
      return { ...project, remaining_tasks: remaining }
    })

    // Stats
    const allOpen = openTasks ?? []
    const stats = {
      total_open: allOpen.length,
      completed_today: (completedToday ?? []).length,
      overdue_count: overdue.length,
      code_tasks_open: allOpen.filter((t) => t.is_code_task).length,
      non_code_tasks_open: allOpen.filter((t) => !t.is_code_task).length,
    }

    return {
      success: true,
      data: {
        date: todayStr,
        overdue,
        today: todayTasks,
        upcoming,
        no_date: noDate,
        active_projects: activeProjects,
        stats,
      },
    }
  } catch (error) {
    console.error('Erreur getDailyBriefing:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

// ─── getTaskStats ────────────────────────────────────

export async function getTaskStats(): Promise<{
  success: boolean
  data?: TaskStats
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    const today = new Date()
    const thisMonday = getMonday(today)
    const lastMonday = new Date(thisMonday)
    lastMonday.setDate(lastMonday.getDate() - 7)
    const lastSunday = new Date(thisMonday)
    lastSunday.setDate(lastSunday.getDate() - 1)

    // 4 weeks ago Monday for weekly_data
    const fourWeeksAgo = new Date(thisMonday)
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    // Fetch all completed tasks (last ~2 months for streak calc)
    const twoMonthsAgo = new Date(today)
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    const { data: completedTasks, error: completedError } = await supabase
      .from('tasks')
      .select('id, completed_at, is_code_task, project_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', twoMonthsAgo.toISOString())
      .order('completed_at', { ascending: false })

    if (completedError) throw new Error(completedError.message)

    // Fetch all tasks for by_project breakdown
    const { data: allTasks, error: allError } = await supabase
      .from('tasks')
      .select('id, project_id, status, is_code_task, created_at')
      .eq('user_id', user.id)
      .not('project_id', 'is', null)

    if (allError) throw new Error(allError.message)

    // Fetch projects for names/colors
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, color')
      .eq('user_id', user.id)

    if (projectsError) throw new Error(projectsError.message)

    const completed = completedTasks ?? []
    const thisMondayStr = toDateString(thisMonday)
    const lastMondayStr = toDateString(lastMonday)
    const lastSundayStr = toDateString(lastSunday)

    // This week / last week counts
    const completedThisWeek = completed.filter((t) => {
      const d = t.completed_at?.split('T')[0] ?? ''
      return d >= thisMondayStr && d <= toDateString(today)
    }).length

    const completedLastWeek = completed.filter((t) => {
      const d = t.completed_at?.split('T')[0] ?? ''
      return d >= lastMondayStr && d <= lastSundayStr
    }).length

    // Weekly trend
    const weeklyTrend =
      completedLastWeek === 0
        ? completedThisWeek > 0
          ? 100
          : 0
        : Math.round(
            ((completedThisWeek - completedLastWeek) / completedLastWeek) * 100
          )

    // Streaks — group completed tasks by date
    const completionDates = new Set<string>()
    for (const t of completed) {
      if (t.completed_at) {
        completionDates.add(t.completed_at.split('T')[0])
      }
    }

    // Current streak: consecutive days ending today (or yesterday)
    let currentStreak = 0
    const checkDate = new Date(today)
    // If no task completed today, start checking from yesterday
    if (!completionDates.has(toDateString(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1)
    }
    while (completionDates.has(toDateString(checkDate))) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Longest streak: iterate sorted dates
    const sortedDates = Array.from(completionDates).sort()
    let longestStreak = 0
    let tempStreak = 1
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1])
      const curr = new Date(sortedDates[i])
      const diffMs = curr.getTime() - prev.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        tempStreak++
      } else {
        tempStreak = 1
      }
      longestStreak = Math.max(longestStreak, tempStreak)
    }
    if (sortedDates.length > 0) {
      longestStreak = Math.max(longestStreak, tempStreak)
    }
    longestStreak = Math.max(longestStreak, currentStreak)

    // By project breakdown
    const projectMap = new Map(
      (projects ?? []).map((p) => [p.id, { name: p.name, color: p.color }])
    )

    const byProjectMap = new Map<
      string,
      { total: number; completed: number; open: number }
    >()

    for (const t of allTasks ?? []) {
      if (!t.project_id) continue
      const entry = byProjectMap.get(t.project_id) ?? {
        total: 0,
        completed: 0,
        open: 0,
      }
      entry.total++
      if (t.status === 'completed') {
        entry.completed++
      } else {
        entry.open++
      }
      byProjectMap.set(t.project_id, entry)
    }

    const byProject = Array.from(byProjectMap.entries()).map(
      ([projectId, counts]) => ({
        project_id: projectId,
        project_name: projectMap.get(projectId)?.name ?? 'Unknown',
        project_color: projectMap.get(projectId)?.color ?? null,
        ...counts,
      })
    )

    // Code vs non-code completed
    const codeTasksCompleted = completed.filter((t) => t.is_code_task).length
    const nonCodeTasksCompleted = completed.filter(
      (t) => !t.is_code_task
    ).length

    // Weekly data — last 4 weeks
    const fourWeeksAgoStr = toDateString(fourWeeksAgo)
    const { data: recentCreated, error: createdError } = await supabase
      .from('tasks')
      .select('id, created_at')
      .eq('user_id', user.id)
      .gte('created_at', fourWeeksAgoStr)

    if (createdError) throw new Error(createdError.message)

    const weeklyData: TaskStats['weekly_data'] = []
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(thisMonday)
      weekStart.setDate(weekStart.getDate() - (3 - w) * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const wsStr = toDateString(weekStart)
      const weStr = toDateString(weekEnd)

      const weekCompleted = completed.filter((t) => {
        const d = t.completed_at?.split('T')[0] ?? ''
        return d >= wsStr && d <= weStr
      }).length

      const weekCreated = (recentCreated ?? []).filter((t) => {
        const d = t.created_at?.split('T')[0] ?? ''
        return d >= wsStr && d <= weStr
      }).length

      weeklyData.push({
        week_start: wsStr,
        completed: weekCompleted,
        created: weekCreated,
      })
    }

    return {
      success: true,
      data: {
        completed_this_week: completedThisWeek,
        completed_last_week: completedLastWeek,
        weekly_trend: weeklyTrend,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        by_project: byProject,
        code_tasks_completed: codeTasksCompleted,
        non_code_tasks_completed: nonCodeTasksCompleted,
        weekly_data: weeklyData,
      },
    }
  } catch (error) {
    console.error('Erreur getTaskStats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
