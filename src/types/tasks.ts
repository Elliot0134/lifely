// types/tasks.ts - Task management types

// ─── Enums ────────────────────────────────────────────

export type CompanyStatus = 'not_started' | 'active' | 'completed'
export type ProjectStatus = 'not_started' | 'in_progress' | 'completed'
export type TaskUrgency = 'urgent' | 'important'
export type TaskDueStatus = 'completed' | 'no_date' | 'overdue' | 'today' | 'upcoming' | 'future'
export type CommentAuthorType = 'user' | 'claude'
export type TaskRecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

// ─── Entities ─────────────────────────────────────────

export interface Company {
  id: string
  user_id: string
  name: string
  status: CompanyStatus
  color: string | null
  icon: string | null
  created_at: string
  updated_at: string
  // Computed
  projects?: Project[]
  project_count?: number
}

export interface Project {
  id: string
  user_id: string
  company_id: string | null
  name: string
  description: string | null
  status: ProjectStatus
  color: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  // Joined
  company?: Company
  tasks?: Task[]
  // Computed
  task_count?: number
  completed_task_count?: number
  progress?: number // 0-100
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  parent_task_id: string | null
  title: string
  description: string | null
  is_completed: boolean
  is_code_task: boolean
  due_date: string | null
  due_datetime: string | null
  urgency: TaskUrgency | null
  sort_order: number
  estimated_minutes: number | null
  scheduled_date: string | null
  scheduled_start_time: string | null
  scheduled_end_time: string | null
  ai_instructions: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Joined (from view)
  project_name?: string
  project_color?: string
  project_status?: string
  company_name?: string
  company_color?: string
  due_status?: TaskDueStatus
  subtask_count?: number
  subtask_completed_count?: number
  tags?: Tag[]
  // Nested
  subtasks?: Task[]
  project?: Project
  comments?: TaskComment[]
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  author_type: CommentAuthorType
  created_at: string
  updated_at: string
}

export interface RecurringTask {
  id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  is_code_task: boolean
  urgency: TaskUrgency | null
  estimated_minutes: number | null
  ai_instructions: string | null
  frequency: TaskRecurrenceFrequency
  day_of_week: number | null
  day_of_month: number | null
  month_of_year: number | null
  start_date: string
  end_date: string | null
  is_active: boolean
  last_generated_at: string | null
  next_due_date: string
  created_at: string
  updated_at: string
  // Joined
  project?: Project
}

// ─── Forms ────────────────────────────────────────────

export interface CreateTaskInput {
  title: string
  description?: string
  project_id?: string
  parent_task_id?: string
  is_code_task?: boolean
  due_date?: string
  due_datetime?: string
  urgency?: TaskUrgency
  estimated_minutes?: number
  scheduled_date?: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  ai_instructions?: string
  tag_ids?: string[]
}

export interface UpdateTaskInput {
  id: string
  title?: string
  description?: string
  project_id?: string | null
  parent_task_id?: string | null
  is_completed?: boolean
  is_code_task?: boolean
  due_date?: string | null
  due_datetime?: string | null
  urgency?: TaskUrgency | null
  sort_order?: number
  estimated_minutes?: number | null
  scheduled_date?: string | null
  scheduled_start_time?: string | null
  scheduled_end_time?: string | null
  ai_instructions?: string | null
  tag_ids?: string[]
}

export interface CreateProjectInput {
  name: string
  description?: string
  company_id?: string
  color?: string
  start_date?: string
  end_date?: string
}

export interface UpdateProjectInput {
  id: string
  name?: string
  description?: string
  company_id?: string | null
  status?: ProjectStatus
  color?: string | null
  start_date?: string | null
  end_date?: string | null
}

export interface CreateCompanyInput {
  name: string
  color?: string
  icon?: string
}

export interface UpdateCompanyInput {
  id: string
  name?: string
  status?: CompanyStatus
  color?: string | null
  icon?: string | null
}

export interface CreateTagInput {
  name: string
  color?: string
}

export interface CreateCommentInput {
  task_id: string
  content: string
  author_type?: CommentAuthorType
}

export interface CreateRecurringTaskInput {
  title: string
  description?: string
  project_id?: string
  is_code_task?: boolean
  urgency?: TaskUrgency
  estimated_minutes?: number
  ai_instructions?: string
  frequency: TaskRecurrenceFrequency
  day_of_week?: number
  day_of_month?: number
  month_of_year?: number
  start_date?: string
  end_date?: string
}

export interface UpdateRecurringTaskInput {
  id: string
  title?: string
  description?: string | null
  project_id?: string | null
  is_code_task?: boolean
  urgency?: TaskUrgency | null
  estimated_minutes?: number | null
  ai_instructions?: string | null
  frequency?: TaskRecurrenceFrequency
  day_of_week?: number | null
  day_of_month?: number | null
  month_of_year?: number | null
  start_date?: string
  end_date?: string | null
  is_active?: boolean
}

// ─── Filters ──────────────────────────────────────────

export interface TaskFilters {
  project_id?: string
  company_id?: string
  is_completed?: boolean
  is_code_task?: boolean
  urgency?: TaskUrgency
  due_status?: TaskDueStatus
  tag_ids?: string[]
  search?: string
  parent_task_id?: string | null // null = top-level only
  scheduled_date?: string // for time blocks view
}

// ─── Briefing ─────────────────────────────────────────

export interface DailyBriefing {
  date: string
  overdue: Task[]
  today: Task[]
  upcoming: Task[] // 3 prochains jours
  no_date: Task[]
  active_projects: (Project & { remaining_tasks: number })[]
  stats: {
    total_open: number
    completed_today: number
    overdue_count: number
    code_tasks_open: number
    non_code_tasks_open: number
  }
  // Briefing intelligent : suggestion de planning
  suggested_schedule?: TimeBlock[]
}

export interface TimeBlock {
  task_id: string
  task: Task
  start_time: string // "09:00"
  end_time: string   // "10:30"
  is_locked: boolean // true = manuellement planifie, false = suggestion auto
}

// ─── Stats ────────────────────────────────────────────

export interface TaskStats {
  // Productivite
  completed_this_week: number
  completed_last_week: number
  weekly_trend: number // % variation
  // Streak
  current_streak: number // jours consecutifs avec au moins 1 tache completee
  longest_streak: number
  // Par projet
  by_project: {
    project_id: string
    project_name: string
    project_color: string | null
    total: number
    completed: number
    open: number
  }[]
  // Par type
  code_tasks_completed: number
  non_code_tasks_completed: number
  // Par periode (4 dernieres semaines)
  weekly_data: {
    week_start: string
    completed: number
    created: number
  }[]
}
