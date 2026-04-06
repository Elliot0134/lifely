import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { CompanyGroup, CreateCompanyGroupInput, UpdateCompanyGroupInput } from '@/types/tasks'

// Query Keys Factory
export const companyGroupKeys = {
  all: ['company-groups'] as const,
  lists: () => [...companyGroupKeys.all, 'list'] as const,
  details: () => [...companyGroupKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyGroupKeys.details(), id] as const,
}

// Fetch functions
async function fetchCompanyGroups(): Promise<CompanyGroup[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('company_groups')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data as CompanyGroup[]
}

async function createCompanyGroup(input: CreateCompanyGroupInput): Promise<CompanyGroup> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Non autorisé')

  const { data, error } = await supabase
    .from('company_groups')
    .insert({
      name: input.name,
      color: input.color ?? null,
      icon: input.icon ?? null,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as CompanyGroup
}

async function updateCompanyGroup(input: UpdateCompanyGroupInput): Promise<CompanyGroup> {
  const supabase = createClient()

  const { id, ...updates } = input

  const { data, error } = await supabase
    .from('company_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as CompanyGroup
}

async function deleteCompanyGroup(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('company_groups')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// React Query Hooks
export function useCompanyGroups() {
  return useQuery({
    queryKey: companyGroupKeys.lists(),
    queryFn: fetchCompanyGroups,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateCompanyGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCompanyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyGroupKeys.lists() })
      toast.success('Groupe créé avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateCompanyGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCompanyGroup,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: companyGroupKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyGroupKeys.detail(id) })
      toast.success('Groupe mis à jour')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteCompanyGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCompanyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyGroupKeys.lists() })
      toast.success('Groupe supprimé')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
