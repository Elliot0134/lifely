'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function HabitsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[habits] Error boundary caught:', error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden="true" />
      <div>
        <h2 className="text-lg font-semibold">Une erreur est survenue</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Impossible d&apos;afficher vos habitudes. Réessayez ou rechargez la page.
        </p>
      </div>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  )
}
