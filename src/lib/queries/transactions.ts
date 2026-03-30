import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Types pour les API
interface TransactionFilters {
  type?: string
  category_id?: string
  account_id?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

interface CreateTransactionData {
  account_id: string
  category_id: string
  type: 'revenue' | 'variable_expense' | 'fixed_expense' | 'credit' | 'savings'
  amount: number
  description?: string
  date?: string
  is_recurring?: boolean
  recurring_id?: string
}

interface UpdateTransactionData {
  account_id?: string
  category_id?: string
  type?: 'revenue' | 'variable_expense' | 'fixed_expense' | 'credit' | 'savings'
  amount?: number
  description?: string
  date?: string
  is_recurring?: boolean
  recurring_id?: string
}

// Query Keys Factory
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
}

// API Functions
async function fetchTransactions(filters: TransactionFilters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== 'all') {
      params.append(key, value.toString())
    }
  })

  const response = await fetch(`/api/transactions?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la récupération des transactions')
  }

  return response.json()
}

async function fetchTransaction(id: string) {
  const response = await fetch(`/api/transactions/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Transaction introuvable')
  }

  return response.json()
}

async function createTransaction(data: CreateTransactionData) {
  const response = await fetch('/api/transactions', {
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

async function updateTransaction(id: string, data: UpdateTransactionData) {
  const response = await fetch(`/api/transactions/${id}`, {
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

async function deleteTransaction(id: string) {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la suppression')
  }

  return response.json()
}

// React Query Hooks
export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      // Invalider toutes les listes de transactions
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      // Invalider aussi les stats du dashboard
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      toast.success('Transaction créée avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionData }) =>
      updateTransaction(id, data),
    onSuccess: (_, { id }) => {
      // Invalider toutes les listes de transactions
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      // Invalider la transaction spécifique
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) })
      // Invalider aussi les stats du dashboard
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      toast.success('Transaction mise à jour avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      // Invalider toutes les listes de transactions
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      // Invalider aussi les stats du dashboard
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      toast.success('Transaction supprimée avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}