"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PreferencesTab() {
  return (
    <div className="grid gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Gestion des preferences - contenu a venir.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
