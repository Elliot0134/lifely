'use client'

import { Plus, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface HabitsEmptyStateProps {
  onAddClick?: () => void
}

export function HabitsEmptyState({ onAddClick }: HabitsEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <Sparkles className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-6 text-xl font-semibold tracking-tight">
          Aucune habitude pour le moment
        </h2>
        <p className="mt-2 text-muted-foreground">
          Créez votre première habitude pour commencer à suivre vos progrès.
        </p>
        {onAddClick ? (
          <Button onClick={onAddClick} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une habitude
          </Button>
        ) : null}
      </div>
    </div>
  )
}
