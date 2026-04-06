'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Building2,
  ExternalLink,
  Link2,
  Mail,
  MapPin,
  Phone,
  Globe,
  Plus,
  Trash2,
  CalendarIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { COMPANY_STATUSES, OWNERSHIP_TYPES } from '@/lib/constants'
import {
  useCompany,
  useUpdateCompany,
  useCompanyLinks,
  useCreateCompanyLink,
  useDeleteCompanyLink,
} from '@/lib/queries/companies'
import { useCompanyGroups } from '@/lib/queries/company-groups'
import type { Company, OwnershipType, CompanyStatus } from '@/types/tasks'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Debounce hook (same pattern as task-detail-sheet) ──

function useDebouncedSave(
  value: string,
  delay: number,
  onSave: (val: string) => void,
  enabled: boolean
) {
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!enabled) return

    const timer = setTimeout(() => {
      onSave(value)
    }, delay)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay, enabled])
}

// ─── Props ──────────────────────────────────────────────

interface CompanyDetailSheetProps {
  company: Company | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Component ──────────────────────────────────────────

export function CompanyDetailSheet({
  company: initialCompany,
  open,
  onOpenChange,
}: CompanyDetailSheetProps) {
  const { data: freshCompany } = useCompany(initialCompany?.id ?? '')
  const company = freshCompany ?? initialCompany

  const { data: links } = useCompanyLinks(company?.id)
  const updateMutation = useUpdateCompany()
  const createLinkMutation = useCreateCompanyLink()
  const deleteLinkMutation = useDeleteCompanyLink(company?.id ?? '')
  const { data: groups } = useCompanyGroups()

  // ─── Local state for editable fields ──────────────────
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [legalForm, setLegalForm] = useState('')
  const [siren, setSiren] = useState('')
  const [siret, setSiret] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [shareCapital, setShareCapital] = useState('')
  const [foundedAt, setFoundedAt] = useState('')
  const [address, setAddress] = useState('')
  const [ownershipShare, setOwnershipShare] = useState('')
  const [role, setRole] = useState('')
  const [joinedAt, setJoinedAt] = useState('')
  const [amountInvested, setAmountInvested] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')

  // Sync local state when company changes
  useEffect(() => {
    if (company) {
      setDescription(company.description ?? '')
      setNotes(company.notes ?? '')
      setLegalForm(company.legal_form ?? '')
      setSiren(company.siren ?? '')
      setSiret(company.siret ?? '')
      setVatNumber(company.vat_number ?? '')
      setShareCapital(company.share_capital?.toString() ?? '')
      setFoundedAt(company.founded_at ?? '')
      setAddress(company.address ?? '')
      setOwnershipShare(company.ownership_share?.toString() ?? '')
      setRole(company.role ?? '')
      setJoinedAt(company.joined_at ?? '')
      setAmountInvested(company.amount_invested?.toString() ?? '')
      setEmail(company.email ?? '')
      setPhone(company.phone ?? '')
      setWebsite(company.website ?? '')
    }
  }, [company?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Save helpers ─────────────────────────────────────

  const saveField = useCallback(
    (field: string, value: unknown) => {
      if (!company) return
      updateMutation.mutate({ id: company.id, [field]: value })
    },
    [company, updateMutation]
  )

  // Debounced saves for text fields
  useDebouncedSave(description, 500, (val) => saveField('description', val || null), !!company && description !== (company.description ?? ''))
  useDebouncedSave(notes, 500, (val) => saveField('notes', val || null), !!company && notes !== (company.notes ?? ''))
  useDebouncedSave(legalForm, 500, (val) => saveField('legal_form', val || null), !!company && legalForm !== (company.legal_form ?? ''))
  useDebouncedSave(siren, 500, (val) => saveField('siren', val || null), !!company && siren !== (company.siren ?? ''))
  useDebouncedSave(siret, 500, (val) => saveField('siret', val || null), !!company && siret !== (company.siret ?? ''))
  useDebouncedSave(vatNumber, 500, (val) => saveField('vat_number', val || null), !!company && vatNumber !== (company.vat_number ?? ''))
  useDebouncedSave(shareCapital, 500, (val) => saveField('share_capital', val ? Number(val) : null), !!company && shareCapital !== (company.share_capital?.toString() ?? ''))
  useDebouncedSave(address, 500, (val) => saveField('address', val || null), !!company && address !== (company.address ?? ''))
  useDebouncedSave(foundedAt, 500, (val) => saveField('founded_at', val || null), !!company && foundedAt !== (company.founded_at ?? ''))
  useDebouncedSave(ownershipShare, 500, (val) => saveField('ownership_share', val ? Number(val) : null), !!company && ownershipShare !== (company.ownership_share?.toString() ?? ''))
  useDebouncedSave(role, 500, (val) => saveField('role', val || null), !!company && role !== (company.role ?? ''))
  useDebouncedSave(joinedAt, 500, (val) => saveField('joined_at', val || null), !!company && joinedAt !== (company.joined_at ?? ''))
  useDebouncedSave(amountInvested, 500, (val) => saveField('amount_invested', val ? Number(val) : null), !!company && amountInvested !== (company.amount_invested?.toString() ?? ''))
  useDebouncedSave(email, 500, (val) => saveField('email', val || null), !!company && email !== (company.email ?? ''))
  useDebouncedSave(phone, 500, (val) => saveField('phone', val || null), !!company && phone !== (company.phone ?? ''))
  useDebouncedSave(website, 500, (val) => saveField('website', val || null), !!company && website !== (company.website ?? ''))

  // ─── Link form ────────────────────────────────────────
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [showLinkForm, setShowLinkForm] = useState(false)

  const handleAddLink = () => {
    if (!company || !newLinkLabel.trim() || !newLinkUrl.trim()) return
    createLinkMutation.mutate(
      { company_id: company.id, label: newLinkLabel.trim(), url: newLinkUrl.trim() },
      {
        onSuccess: () => {
          setNewLinkLabel('')
          setNewLinkUrl('')
          setShowLinkForm(false)
        },
      }
    )
  }

  if (!company) return null

  const ownershipInfo = OWNERSHIP_TYPES.find((t) => t.value === company.ownership_type)
  const statusInfo = COMPANY_STATUSES.find((s) => s.value === company.status)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] overflow-y-auto p-0"
        showCloseButton
      >
        {/* ─── Header ─────────────────────────────────────── */}
        <SheetHeader className="px-4 pt-4 pb-0 pr-10">
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
              style={{
                backgroundColor: (company.color || '#64748b') + '20',
                color: company.color || '#64748b',
              }}
            >
              {company.icon || company.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left text-lg truncate">
                {company.name}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Détails de l&apos;entreprise
              </SheetDescription>
            </div>
          </div>

          {/* Quick badges under title */}
          <div className="flex items-center gap-1.5 pl-14 pt-1">
            <Badge variant="outline" className="h-6 text-[11px] gap-1" style={{ borderColor: ownershipInfo?.color, color: ownershipInfo?.color }}>
              <span className="size-1.5 rounded-full" style={{ backgroundColor: ownershipInfo?.color }} />
              {ownershipInfo?.label}
            </Badge>
            <Badge
              variant="secondary"
              className="h-6 text-[11px] gap-1"
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: statusInfo?.color }}
              />
              {statusInfo?.label}
            </Badge>
          </div>
        </SheetHeader>

        <Separator className="my-3" />

        {/* ─── Properties grid ────────────────────────────── */}
        <div className="px-4 space-y-2">
          <div className="grid grid-cols-[100px_1fr] gap-y-2 gap-x-3 items-center text-sm">
            {/* Statut */}
            <span className="text-xs text-muted-foreground">Statut</span>
            <Select
              value={company.status}
              onValueChange={(v) => saveField('status', v)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Relation */}
            <span className="text-xs text-muted-foreground">Relation</span>
            <Select
              value={company.ownership_type}
              onValueChange={(v) => saveField('ownership_type', v)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OWNERSHIP_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Groupe */}
            <span className="text-xs text-muted-foreground">Groupe</span>
            <Select
              value={company.group_id ?? '_none'}
              onValueChange={(v) => saveField('group_id', v === '_none' ? null : v)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Aucun groupe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">
                  <span className="text-muted-foreground">Aucun groupe</span>
                </SelectItem>
                {groups?.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: g.color || '#64748b' }} />
                      {g.icon ? `${g.icon} ` : ''}{g.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-3" />

        {/* ─── Description ────────────────────────────────── */}
        <div className="px-4 space-y-1.5">
          <span className="text-xs text-muted-foreground">Description</span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description de l'entreprise..."
            rows={2}
            className="text-sm resize-none border-none bg-muted/50 shadow-none focus-visible:ring-1"
          />
        </div>

        <Separator className="my-3" />

        {/* ─── Identité légale ────────────────────────────── */}
        <div className="px-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Identité légale</span>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-y-1.5 gap-x-3 items-center text-sm">
            <span className="text-xs text-muted-foreground">Forme</span>
            <Input value={legalForm} onChange={(e) => setLegalForm(e.target.value)} placeholder="SAS, SARL, SCI..." className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />

            <span className="text-xs text-muted-foreground">SIREN</span>
            <Input value={siren} onChange={(e) => setSiren(e.target.value)} placeholder="123 456 789" className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />

            <span className="text-xs text-muted-foreground">SIRET</span>
            <Input value={siret} onChange={(e) => setSiret(e.target.value)} placeholder="123 456 789 00012" className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />

            <span className="text-xs text-muted-foreground">N° TVA</span>
            <Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="FR12345678901" className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />

            <span className="text-xs text-muted-foreground">Capital</span>
            <div className="flex items-center gap-1">
              <Input value={shareCapital} onChange={(e) => setShareCapital(e.target.value)} placeholder="—" type="number" className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />
              <span className="text-xs text-muted-foreground shrink-0">€</span>
            </div>

            <span className="text-xs text-muted-foreground">Création</span>
            <Input value={foundedAt} onChange={(e) => setFoundedAt(e.target.value)} type="date" className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />

            <span className="text-xs text-muted-foreground">Adresse</span>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 rue..." className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />
          </div>
        </div>

        <Separator className="my-3" />

        {/* ─── Participation ──────────────────────────────── */}
        <div className="px-4 space-y-2">
          <span className="text-xs font-medium">Participation</span>
          <div className="grid grid-cols-[100px_1fr] gap-y-1.5 gap-x-3 items-center text-sm">
            <span className="text-xs text-muted-foreground">Parts</span>
            <div className="flex items-center gap-1">
              <Input value={ownershipShare} onChange={(e) => setOwnershipShare(e.target.value)} placeholder="—" type="number" className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />
              <span className="text-xs text-muted-foreground shrink-0">%</span>
            </div>

            <span className="text-xs text-muted-foreground">Rôle</span>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Président, CTO..." className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />

            <span className="text-xs text-muted-foreground">Entrée</span>
            <Input value={joinedAt} onChange={(e) => setJoinedAt(e.target.value)} type="date" className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />

            <span className="text-xs text-muted-foreground">Investi</span>
            <div className="flex items-center gap-1">
              <Input value={amountInvested} onChange={(e) => setAmountInvested(e.target.value)} placeholder="—" type="number" className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />
              <span className="text-xs text-muted-foreground shrink-0">€</span>
            </div>
          </div>
        </div>

        <Separator className="my-3" />

        {/* ─── Contact ────────────────────────────────────── */}
        <div className="px-4 space-y-2">
          <span className="text-xs font-medium">Contact</span>
          <div className="grid grid-cols-[100px_1fr] gap-y-1.5 gap-x-3 items-center text-sm">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="size-3" /> Email
            </span>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@..." type="email" className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />

            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="size-3" /> Téléphone
            </span>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33..." className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />

            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="size-3" /> Site web
            </span>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="h-7 text-xs border-none bg-muted/50 shadow-none focus-visible:ring-1" />
          </div>
        </div>

        <Separator className="my-3" />

        {/* ─── Liens custom ───────────────────────────────── */}
        <div className="px-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Link2 className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Liens</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() => setShowLinkForm(true)}
            >
              <Plus className="size-3" />
              Ajouter
            </Button>
          </div>

          {links && links.length > 0 && (
            <div className="space-y-0.5">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-2 group rounded-md px-2 py-1 hover:bg-muted/50"
                >
                  <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs text-primary hover:underline truncate"
                  >
                    {link.label}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive shrink-0"
                    onClick={() => deleteLinkMutation.mutate(link.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {links && links.length === 0 && !showLinkForm && (
            <p className="text-xs text-muted-foreground px-2">Aucun lien</p>
          )}

          {showLinkForm && (
            <div className="space-y-1.5 rounded-lg border p-2">
              <Input
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                placeholder="Nom (ex: Google Drive)"
                className="h-7 text-xs"
              />
              <Input
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://..."
                className="h-7 text-xs"
              />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="h-6 text-xs"
                  onClick={handleAddLink}
                  disabled={!newLinkLabel.trim() || !newLinkUrl.trim() || createLinkMutation.isPending}
                >
                  Ajouter
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => { setShowLinkForm(false); setNewLinkLabel(''); setNewLinkUrl('') }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-3" />

        {/* ─── Notes ──────────────────────────────────────── */}
        <div className="px-4 space-y-1.5">
          <span className="text-xs text-muted-foreground">Notes</span>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes personnelles..."
            rows={4}
            className="text-sm resize-none border-none bg-muted/50 shadow-none focus-visible:ring-1"
          />
        </div>

        {/* ─── Footer spacer ─────────────────────────────── */}
        <div className="h-4" />
      </SheetContent>
    </Sheet>
  )
}
