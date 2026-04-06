// types/tasks.ts - Task management types

// ─── Enums ────────────────────────────────────────────

export type CompanyStatus = 'not_started' | 'active' | 'completed'
export type OwnershipType = 'owner' | 'shareholder' | 'client' | 'partner' | 'other'
export type ProjectStatus = 'not_started' | 'in_progress' | 'completed'
export type TaskStatus = 'todo' | 'in_progress' | 'completed'
export type TaskDueStatus = 'no_date' | 'overdue' | 'today' | 'upcoming' | 'future'
export type CommentAuthorType = 'user' | 'claude'
export type TaskRecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

// ─── Entities ─────────────────────────────────────────

export interface CompanyGroup {
  id: string
  user_id: string
  name: string
  color: string | null
  icon: string | null
  sort_order: number
  created_at: string
  updated_at: string
  // Computed
  companies?: Company[]
  company_count?: number
}

export interface CompanyLink {
  id: string
  company_id: string
  user_id: string
  label: string
  url: string
  sort_order: number
  created_at: string
}

export interface Company {
  id: string
  user_id: string
  name: string
  status: CompanyStatus
  color: string | null
  icon: string | null
  is_personal: boolean
  group_id: string | null
  ownership_type: OwnershipType
  // Legal
  legal_form: string | null
  siren: string | null
  siret: string | null
  vat_number: string | null
  share_capital: number | null
  founded_at: string | null
  address: string | null
  // Participation
  ownership_share: number | null
  role: string | null
  joined_at: string | null
  amount_invested: number | null
  // Contact
  email: string | null
  phone: string | null
  website: string | null
  // Text
  description: string | null
  notes: string | null
  // Timestamps
  created_at: string
  updated_at: string
  // Joined
  group?: CompanyGroup
  links?: CompanyLink[]
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
  body: string | null
  status: TaskStatus
  is_code_task: boolean
  due_date: string | null
  due_datetime: string | null
  is_urgent: boolean
  is_important: boolean
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
  is_urgent: boolean
  is_important: boolean
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
  is_urgent?: boolean
  is_important?: boolean
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
  status?: TaskStatus
  is_code_task?: boolean
  due_date?: string | null
  due_datetime?: string | null
  is_urgent?: boolean
  is_important?: boolean
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

export interface CreateCompanyGroupInput {
  name: string
  color?: string
  icon?: string
}

export interface UpdateCompanyGroupInput {
  id: string
  name?: string
  color?: string | null
  icon?: string | null
  sort_order?: number
}

export interface CreateCompanyInput {
  name: string
  color?: string
  icon?: string
  group_id?: string
  ownership_type?: OwnershipType
}

export interface UpdateCompanyInput {
  id: string
  name?: string
  status?: CompanyStatus
  color?: string | null
  icon?: string | null
  group_id?: string | null
  ownership_type?: OwnershipType
  // Legal
  legal_form?: string | null
  siren?: string | null
  siret?: string | null
  vat_number?: string | null
  share_capital?: number | null
  founded_at?: string | null
  address?: string | null
  // Participation
  ownership_share?: number | null
  role?: string | null
  joined_at?: string | null
  amount_invested?: number | null
  // Contact
  email?: string | null
  phone?: string | null
  website?: string | null
  // Text
  description?: string | null
  notes?: string | null
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
  is_urgent?: boolean
  is_important?: boolean
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
  is_urgent?: boolean
  is_important?: boolean
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

export interface CompanyFilters {
  group_id?: string
  ownership_type?: OwnershipType
  status?: CompanyStatus
  search?: string
}

export interface ProjectFilters {
  company_id?: string
  status?: ProjectStatus
  search?: string
}

export interface TaskFilters {
  project_id?: string
  company_id?: string
  status?: TaskStatus
  is_code_task?: boolean
  is_urgent?: boolean
  is_important?: boolean
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

// ─── Notes ────────────────────────────────────────────

export type NoteEntityType = 'task' | 'project' | 'company' | 'personal'

export interface Note {
  id: string
  user_id: string
  title: string
  content: Record<string, unknown> | null
  entity_type: NoteEntityType
  entity_id: string | null
  color: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
  // Joined
  tags?: Tag[]
  // Resolved entity name
  entity_name?: string
}

export interface CreateNoteInput {
  title: string
  content?: Record<string, unknown>
  entity_type?: NoteEntityType
  entity_id?: string
  color?: string
  is_pinned?: boolean
  tag_ids?: string[]
}

export interface UpdateNoteInput {
  id: string
  title?: string
  content?: Record<string, unknown> | null
  entity_type?: NoteEntityType
  entity_id?: string | null
  color?: string | null
  is_pinned?: boolean
  tag_ids?: string[]
}

export interface NoteFilters {
  entity_type?: NoteEntityType
  entity_id?: string
  tag_ids?: string[]
  is_pinned?: boolean
  search?: string
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
