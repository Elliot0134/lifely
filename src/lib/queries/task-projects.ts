import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectFilters, CreateProjectInput, UpdateProjectInput } from '@/types/tasks'

// Query Keys Factory
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectFilters) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

// Fetch functions
async function fetchProjects(filters: ProjectFilters = {}): Promise<Project[]> {
  const supabase = createClient()

  let query = supabase
    .from('projects')
    .select('*, company:companies(*)')
    .order('name', { ascending: true })

  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Fetch task counts for each project
  if (data && data.length > 0) {
    const projectIds = data.map((p) => p.id)
    const { data: taskCounts } = await supabase
      .from('tasks')
      .select('project_id, status')
      .in('project_id', projectIds)

    if (taskCounts) {
      const countMap = new Map<string, { total: number; completed: number }>()
      for (const task of taskCounts) {
        if (!task.project_id) continue
        const entry = countMap.get(task.project_id) ?? { total: 0, completed: 0 }
        entry.total++
        if (task.status === 'completed') entry.completed++
        countMap.set(task.project_id, entry)
      }

      for (const project of data) {
        const counts = countMap.get(project.id)
        project.task_count = counts?.total ?? 0
        project.completed_task_count = counts?.completed ?? 0
        project.progress = project.task_count > 0
          ? Math.round((project.completed_task_count / project.task_count) * 100)
          : 0
      }
    }
  }

  return data as Project[]
}

async function fetchProject(id: string): Promise<Project> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*, company:companies(*)')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Project
}

async function createProject(input: CreateProjectInput): Promise<Project> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Non autorisé')
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: input.name,
      description: input.description ?? null,
      company_id: input.company_id ?? null,
      color: input.color ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      user_id: user.id,
      status: 'not_started',
    })
    .select('*, company:companies(*)')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Project
}

async function updateProject(input: UpdateProjectInput): Promise<Project> {
  const supabase = createClient()

  const { id, ...updates } = input

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select('*, company:companies(*)')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Project
}

async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// React Query Hooks
export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => fetchProjects(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProject(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      toast.success('Projet créé avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) })
      toast.success('Projet mis à jour avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      toast.success('Projet supprimé avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
