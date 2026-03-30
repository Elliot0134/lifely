"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sun, Moon, Monitor } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// NOTE: Notification preferences are stored in local state only.
// To persist them, add a `preferences JSONB` column to the `profiles` table
// and save/load via Supabase. The UI is ready for that migration.

interface NotificationPreferences {
  budgetExceeded: boolean
  entryReminders: boolean
  weeklySummary: boolean
}

const THEME_OPTIONS = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Systeme", icon: Monitor },
] as const

export function PreferencesTab() {
  const { theme, setTheme } = useTheme()

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    budgetExceeded: true,
    entryReminders: false,
    weeklySummary: true,
  })
  const [saving, setSaving] = useState(false)

  function handleNotificationChange(key: keyof NotificationPreferences, value: boolean) {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)

    try {
      // TODO: Persist to Supabase when preferences JSONB column is added
      // const supabase = createClient()
      // const { data: { user } } = await supabase.auth.getUser()
      // await supabase.from("profiles").update({
      //   preferences: { notifications },
      //   updated_at: new Date().toISOString(),
      // }).eq("id", user.id)

      // Simulate save delay for UX feedback
      await new Promise((resolve) => setTimeout(resolve, 300))

      toast.success("Preferences enregistrees")
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 max-w-2xl">
      {/* Theme Section */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
          <CardDescription>
            Choisissez le theme de l&apos;application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon
              const isActive = theme === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors cursor-pointer",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-background hover:bg-accent"
                  )}
                  aria-label={`Theme ${option.label}`}
                  aria-pressed={isActive}
                >
                  <Icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Currency Section */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Devise</CardTitle>
          <CardDescription>
            Devise utilisee pour l&apos;affichage des montants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">EUR</Badge>
            <span className="text-sm text-muted-foreground">Euro</span>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configurez vos alertes et rappels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="budget-exceeded">Depassement de budget</Label>
              <p className="text-xs text-muted-foreground">
                Recevoir une alerte quand un budget est depasse
              </p>
            </div>
            <Switch
              id="budget-exceeded"
              checked={notifications.budgetExceeded}
              onCheckedChange={(value) => handleNotificationChange("budgetExceeded", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="entry-reminders">Rappels de saisie</Label>
              <p className="text-xs text-muted-foreground">
                Rappel quotidien pour saisir vos depenses
              </p>
            </div>
            <Switch
              id="entry-reminders"
              checked={notifications.entryReminders}
              onCheckedChange={(value) => handleNotificationChange("entryReminders", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-summary">Resume hebdomadaire</Label>
              <p className="text-xs text-muted-foreground">
                Recevoir un resume de vos finances chaque semaine
              </p>
            </div>
            <Switch
              id="weekly-summary"
              checked={notifications.weeklySummary}
              onCheckedChange={(value) => handleNotificationChange("weeklySummary", value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
