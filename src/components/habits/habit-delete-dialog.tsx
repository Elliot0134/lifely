'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteHabit } from '@/lib/queries/habits'
import type { Habit } from '@/types/habit'

interface HabitDeleteDialogProps {
  habit: Habit | null
  onOpenChange: (open: boolean) => void
}

export function HabitDeleteDialog({
  habit,
  onOpenChange,
}: HabitDeleteDialogProps) {
  const deleteMutation = useDeleteHabit()
  const open = habit !== null

  const handleConfirm = async () => {
    if (!habit) return
    try {
      await deleteMutation.mutateAsync(habit.id)
      onOpenChange(false)
    } catch {
      // Hook already toasts on error
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette habitude&nbsp;?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est définitive. Toutes les complétions associées
            seront aussi supprimées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={deleteMutation.isPending}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
