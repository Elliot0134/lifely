'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Database, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { forceInitDefaultCategories } from '@/lib/actions/init-default-data'

export function InitDefaultDataButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  const handleInitCategories = () => {
    startTransition(async () => {
      try {
        const result = await forceInitDefaultCategories()

        if (result.success) {
          toast.success(result.message)
          setResult('✅ ' + result.message)
        } else {
          toast.error(result.error || 'Erreur lors de l\'initialisation')
          setResult('❌ ' + (result.error || 'Erreur'))
        }
      } catch (error) {
        toast.error('Erreur lors de l\'initialisation des catégories')
        setResult('❌ Erreur inconnue')
      }
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Initialisation des données par défaut
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Cliquez pour créer les catégories par défaut pour votre compte.
        </p>

        <Button
          onClick={handleInitCategories}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Créer les catégories par défaut
            </>
          )}
        </Button>

        {result && (
          <div className="p-3 rounded-md bg-muted">
            <p className="text-sm">{result}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}