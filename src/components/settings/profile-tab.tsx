"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Camera } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ProfileData {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  currency: string | null
}

function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    return name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }
  return email[0]?.toUpperCase() ?? "?"
}

export function ProfileTab() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          toast.error("Impossible de charger le profil")
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url, currency")
          .eq("id", user.id)
          .single()

        if (error) {
          toast.error("Impossible de charger le profil")
          setLoading(false)
          return
        }

        setProfile(data)
        setFullName(data.full_name ?? "")
        setAvatarUrl(data.avatar_url)
      } catch {
        toast.error("Une erreur est survenue")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo")
      return
    }

    setUploading(true)

    try {
      // Show preview immediately
      const objectUrl = URL.createObjectURL(file)
      setAvatarPreview(objectUrl)

      const fileExt = file.name.split(".").pop()
      const filePath = `${profile.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        toast.error("Erreur lors de l'upload de l'avatar")
        setAvatarPreview(null)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Add cache-busting param
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`
      setAvatarUrl(urlWithCacheBust)
      setAvatarPreview(null)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBust, updated_at: new Date().toISOString() })
        .eq("id", profile.id)

      if (updateError) {
        toast.error("Erreur lors de la mise à jour de l'avatar")
        return
      }

      toast.success("Avatar mis à jour")
    } catch {
      toast.error("Erreur lors de l'upload")
      setAvatarPreview(null)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function handleSave() {
    if (!profile) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) {
        toast.error("Erreur lors de la sauvegarde")
        return
      }

      setProfile((prev) => (prev ? { ...prev, full_name: fullName.trim() || null } : null))
      toast.success("Profil mis à jour avec succès")
    } catch {
      toast.error("Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 max-w-2xl">
        <Card className="bg-card">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="grid gap-6 max-w-2xl">
        <Card className="bg-card">
          <CardContent className="py-8">
            <p className="text-muted-foreground text-sm text-center">
              Impossible de charger le profil.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayUrl = avatarPreview ?? avatarUrl
  const initials = getInitials(profile.full_name, profile.email)
  const hasChanges = fullName.trim() !== (profile.full_name ?? "")

  return (
    <div className="grid gap-6 max-w-2xl">
      {/* Avatar Section */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Avatar"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              aria-label="Changer la photo de profil"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {profile.full_name ?? profile.email}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou GIF. 2 Mo max.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info Section */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom complet"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label>Devise</Label>
            <div>
              <Badge variant="secondary">EUR</Badge>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
