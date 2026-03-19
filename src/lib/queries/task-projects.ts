import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types/tasks'

// Query Keys Factory
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: { company_id?: string; status?: string }) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

// Fetch functions
async function fetchProjects(filters: { company_id?: string; status?: string } = {}): Promise<Project[]> {
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

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
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
export function useProjects(filters: { company_id?: string; status?: string } = {}) {
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
