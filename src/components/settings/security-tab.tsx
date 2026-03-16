"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SecurityTab() {
  return (
    <div className="grid gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Securite</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Gestion de la securite - contenu a venir.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
