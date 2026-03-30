import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Types pour les API
interface CategoryFilters {
  transaction_type?: string
  account_id?: string
}

interface CreateCategoryData {
  account_id: string
  name: string
  icon?: string
  color?: string
  transaction_type: 'revenue' | 'variable_expense' | 'fixed_expense' | 'credit' | 'savings'
  sort_order?: number
}

interface UpdateCategoryData {
  account_id?: string
  name?: string
  icon?: string
  color?: string
  transaction_type?: 'revenue' | 'variable_expense' | 'fixed_expense' | 'credit' | 'savings'
  sort_order?: number
}

// Query Keys Factory
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: CategoryFilters) => [...categoryKeys.lists(), filters] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

// API Functions
async function fetchCategories(filters: CategoryFilters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString())
    }
  })

  const response = await fetch(`/api/categories?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la récupération des catégories')
  }

  return response.json()
}

async function createCategory(data: CreateCategoryData) {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la création')
  }

  return response.json()
}

async function updateCategory(id: string, data: UpdateCategoryData) {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la mise à jour')
  }

  return response.json()
}

async function deleteCategory(id: string) {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la suppression')
  }

  return response.json()
}

// React Query Hooks
export function useCategories(filters: CategoryFilters = {}) {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: () => fetchCategories(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes (les catégories changent peu)
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      // Invalider toutes les listes de catégories
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      toast.success('Catégorie créée avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) =>
      updateCategory(id, data),
    onSuccess: (_, { id }) => {
      // Invalider toutes les listes de catégories
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      // Invalider la catégorie spécifique
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) })
      toast.success('Catégorie mise à jour avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      // Invalider toutes les listes de catégories
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      toast.success('Catégorie supprimée avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}