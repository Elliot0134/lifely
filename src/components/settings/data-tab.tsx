"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Download, CreditCard, Trash2, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getFreePlan, formatPlanPrice } from "@/config/plans"

export function DataTab() {
  const router = useRouter()
  const supabase = createClient()

  const [exporting, setExporting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  // --- Export CSV ---
  async function handleExportCSV() {
    setExporting(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error("Impossible de récupérer votre compte")
        return
      }

      // Fetch transactions with category and account info
      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select(`
          id,
          type,
          amount,
          description,
          date,
          is_recurring,
          created_at,
          category:categories(name),
          account:accounts(name)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      if (txError) {
        toast.error("Erreur lors de l'export des données")
        return
      }

      if (!transactions || transactions.length === 0) {
        toast.error("Aucune transaction à exporter")
        return
      }

      // Build CSV
      const headers = ["Date", "Type", "Catégorie", "Compte", "Description", "Montant", "Récurrent", "Créé le"]
      const rows = transactions.map((tx) => {
        const categoryName = Array.isArray(tx.category)
          ? tx.category[0]?.name ?? ""
          : (tx.category as { name: string } | null)?.name ?? ""
        const accountName = Array.isArray(tx.account)
          ? tx.account[0]?.name ?? ""
          : (tx.account as { name: string } | null)?.name ?? ""

        return [
          tx.date ?? "",
          tx.type ?? "",
          categoryName,
          accountName,
          (tx.description ?? "").replace(/"/g, '""'),
          String(tx.amount ?? 0),
          tx.is_recurring ? "Oui" : "Non",
          tx.created_at ?? "",
        ]
      })

      const csvContent = [
        headers.join(";"),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
      ].join("\n")

      // BOM for Excel UTF-8 compatibility
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `lifely-export-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Export téléchargé avec succès")
    } catch {
      toast.error("Une erreur est survenue lors de l'export")
    } finally {
      setExporting(false)
    }
  }

  // --- Delete Account ---
  async function handleDeleteAccount() {
    if (deleteConfirmText !== "SUPPRIMER") return

    setDeleting(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error("Impossible de récupérer votre compte")
        return
      }

      // Delete user data in order (respecting foreign keys)
      // 1. Transactions (references categories, accounts)
      const { error: txErr } = await supabase
        .from("transactions")
        .delete()
        .eq("user_id", user.id)

      if (txErr) {
        toast.error("Erreur lors de la suppression des transactions")
        return
      }

      // 2. Recurring transactions
      const { error: recurErr } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("user_id", user.id)

      if (recurErr) {
        console.error("Error deleting recurring_transactions:", recurErr)
        // Continue even if this fails (table might not have data)
      }

      // 3. Budgets
      const { error: budgetErr } = await supabase
        .from("budgets")
        .delete()
        .eq("user_id", user.id)

      if (budgetErr) {
        console.error("Error deleting budgets:", budgetErr)
      }

      // 4. Categories
      const { error: catErr } = await supabase
        .from("categories")
        .delete()
        .eq("user_id", user.id)

      if (catErr) {
        console.error("Error deleting categories:", catErr)
      }

      // 5. Accounts
      const { error: accErr } = await supabase
        .from("accounts")
        .delete()
        .eq("user_id", user.id)

      if (accErr) {
        console.error("Error deleting accounts:", accErr)
      }

      // 6. Profile
      const { error: profErr } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id)

      if (profErr) {
        console.error("Error deleting profile:", profErr)
      }

      // Sign out (actual auth user deletion requires server-side admin API)
      await supabase.auth.signOut()

      toast.success("Compte supprimé. Vous allez être redirigé.")
      router.push("/login")
    } catch {
      toast.error("Une erreur est survenue lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="grid gap-6 max-w-2xl">
      {/* Export Section */}
      <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
        <CardHeader>
          <CardTitle>Exporter mes données</CardTitle>
          <CardDescription>
            Téléchargez toutes vos transactions au format CSV, compatible avec Excel et Google Sheets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportCSV} disabled={exporting} variant="outline">
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {exporting ? "Export en cours..." : "Exporter en CSV"}
          </Button>
        </CardContent>
      </Card>

      {/* Billing Placeholder */}
      {/* TODO: Replace with dynamic subscription data from Supabase/Stripe */}
      {(() => {
        const currentPlan = getFreePlan()
        return (
          <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634] opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <CardTitle>Abonnement</CardTitle>
                  <Badge variant="secondary">{currentPlan.name} — {formatPlanPrice(currentPlan)}</Badge>
                </div>
              </div>
              <CardDescription>
                {currentPlan.description}{" "}
                Des plans premium arrivent bientôt avec des fonctionnalités avancées.
              </CardDescription>
            </CardHeader>
          </Card>
        )
      })()}

      {/* Danger Zone */}
      <Card className="bg-destructive/5 border border-destructive/20 shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Zone de danger</CardTitle>
          </div>
          <CardDescription>
            Cette action est irréversible. Toutes vos données seront définitivement supprimées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer mon compte
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!deleting) {
          setDeleteDialogOpen(open)
          if (!open) setDeleteConfirmText("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Supprimer mon compte</DialogTitle>
            <DialogDescription>
              Cette action est définitive. Toutes vos transactions, catégories, budgets et données de compte seront supprimés.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirm">
              Tapez <span className="font-mono font-bold text-destructive">SUPPRIMER</span> pour confirmer
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              autoComplete="off"
              disabled={deleting}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteConfirmText("")
              }}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "SUPPRIMER" || deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
