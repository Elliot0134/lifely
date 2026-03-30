"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, EyeOff, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!currentPassword) {
      newErrors.currentPassword = "Le mot de passe actuel est requis"
    }

    if (!newPassword) {
      newErrors.newPassword = "Le nouveau mot de passe est requis"
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "8 caractères minimum"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "La confirmation est requise"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleChangePassword() {
    if (!validate()) return

    setSaving(true)

    try {
      const supabase = createClient()

      // Verify current password by re-authenticating
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        toast.error("Impossible de récupérer votre compte")
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        setErrors({ currentPassword: "Mot de passe actuel incorrect" })
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        toast.error("Erreur lors de la mise à jour du mot de passe")
        return
      }

      toast.success("Mot de passe mis à jour avec succès")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setErrors({})
    } catch {
      toast.error("Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  const hasInput = currentPassword || newPassword || confirmPassword

  return (
    <div className="grid gap-6 max-w-2xl">
      {/* Change Password Section */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
          <CardDescription>
            Mettez à jour votre mot de passe pour sécuriser votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value)
                  if (errors.currentPassword) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.currentPassword
                      return next
                    })
                  }
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showCurrent ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (errors.newPassword) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.newPassword
                      return next
                    })
                  }
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showNew ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            )}
            <p className="text-xs text-muted-foreground">8 caractères minimum</p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.confirmPassword
                      return next
                    })
                  }
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleChangePassword} disabled={saving || !hasInput}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mettre à jour le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Section */}
      <Card className="bg-card opacity-60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <CardTitle>Authentification à deux facteurs</CardTitle>
              <Badge variant="secondary">Bientôt disponible</Badge>
            </div>
          </div>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire à votre compte avec
            l&apos;authentification à deux facteurs (2FA).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled variant="outline">
            Configurer la 2FA
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
