"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DataTab() {
  return (
    <div className="grid gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Donnees</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Gestion des donnees - contenu a venir.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
