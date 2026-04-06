import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { createPersonalCompany } from '@/lib/actions/companies'
import { companyGroupKeys } from '@/lib/queries/company-groups'
import type { Company, CompanyLink, CreateCompanyInput, UpdateCompanyInput } from '@/types/tasks'

// Query Keys Factory
export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
}

// Fetch functions
async function fetchCompanies(): Promise<Company[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('companies')
    .select('*, group:company_groups(*)')
    .order('is_personal', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as Company[]
}

async function fetchCompany(id: string): Promise<Company> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('companies')
    .select('*, group:company_groups(*), links:company_links(*)')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Company
}

async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Non autorisé')
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: input.name,
      color: input.color ?? null,
      icon: input.icon ?? null,
      group_id: input.group_id ?? null,
      ownership_type: input.ownership_type ?? 'owner',
      user_id: user.id,
    })
    .select('*, group:company_groups(*)')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Company
}

async function updateCompany(input: UpdateCompanyInput): Promise<Company> {
  const supabase = createClient()

  const { id, ...updates } = input

  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Company
}

async function deleteCompany(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// React Query Hooks
export function useCompanies() {
  return useQuery({
    queryKey: companyKeys.lists(),
    queryFn: fetchCompanies,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => fetchCompany(id),
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyGroupKeys.lists() })
      toast.success('Entreprise créée avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCompany,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: companyGroupKeys.lists() })
      toast.success('Entreprise mise à jour avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyGroupKeys.lists() })
      toast.success('Entreprise supprimée avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// ─── Company Links ──────────────────────────────────────

async function fetchCompanyLinks(companyId: string): Promise<CompanyLink[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('company_links')
    .select('*')
    .eq('company_id', companyId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data as CompanyLink[]
}

async function createCompanyLink(input: { company_id: string; label: string; url: string }): Promise<CompanyLink> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Non autorisé')

  const { data, error } = await supabase
    .from('company_links')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as CompanyLink
}

async function deleteCompanyLink(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('company_links').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export function useCompanyLinks(companyId: string | undefined) {
  return useQuery({
    queryKey: [...companyKeys.detail(companyId ?? ''), 'links'],
    queryFn: () => fetchCompanyLinks(companyId!),
    enabled: !!companyId,
  })
}

export function useCreateCompanyLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCompanyLink,
    onSuccess: (_, { company_id }) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(company_id) })
      toast.success('Lien ajouté')
    },
    onError: (error: Error) => { toast.error(error.message) },
  })
}

export function useDeleteCompanyLink(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCompanyLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(companyId) })
      toast.success('Lien supprimé')
    },
    onError: (error: Error) => { toast.error(error.message) },
  })
}

/**
 * Ensures a personal company exists for the current user.
 * Creates one if missing. Returns the personal company data.
 */
export async function ensurePersonalCompany(): Promise<Company | null> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return null

  // Check if personal company already exists
  const { data: existing } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_personal', true)
    .maybeSingle()

  if (existing) return existing as Company

  // Create via server action
  const result = await createPersonalCompany(user.id)
  if (!result.success) return null

  return result.data as Company
}
