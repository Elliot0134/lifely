"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProfileTab() {
  return (
    <div className="grid gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Gestion du profil utilisateur - contenu a venir.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
