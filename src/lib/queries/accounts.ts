import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Types pour les API
interface CreateAccountData {
  name: string
  type: 'personal' | 'business'
  is_default?: boolean
}

interface UpdateAccountData {
  name?: string
  type?: 'personal' | 'business'
  is_default?: boolean
}

// Query Keys Factory
export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
}

// API Functions
async function fetchAccounts() {
  const response = await fetch('/api/accounts')

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la récupération des comptes')
  }

  return response.json()
}

async function createAccount(data: CreateAccountData) {
  const response = await fetch('/api/accounts', {
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

async function updateAccount(id: string, data: UpdateAccountData) {
  const response = await fetch(`/api/accounts/${id}`, {
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

async function deleteAccount(id: string) {
  const response = await fetch(`/api/accounts/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la suppression')
  }

  return response.json()
}

// React Query Hooks
export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.lists(),
    queryFn: fetchAccounts,
    staleTime: 10 * 60 * 1000, // 10 minutes (les comptes changent peu)
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      // Invalider la liste des comptes
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Compte créé avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountData }) =>
      updateAccount(id, data),
    onSuccess: (_, { id }) => {
      // Invalider la liste des comptes
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      // Invalider le compte spécifique
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) })
      toast.success('Compte mis à jour avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      // Invalider la liste des comptes
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Compte supprimé avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Hook utilitaire pour obtenir le compte par défaut
export function useDefaultAccount() {
  const { data: accountsData } = useAccounts()

  if (!accountsData?.data) return null

  return accountsData.data.find((account: any) => account.is_default) || accountsData.data[0]
}