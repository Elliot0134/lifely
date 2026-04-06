'use client'

import { useState, useMemo } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Building2, Plus, RefreshCw } from 'lucide-react'

import { useCompanies, useDeleteCompany, useUpdateCompany } from '@/lib/queries/companies'
import { useCompanyGroups, useDeleteCompanyGroup } from '@/lib/queries/company-groups'
import { COMPANY_STATUSES, OWNERSHIP_TYPES } from '@/lib/constants'
import { CompanyModal } from '@/components/companies/company-modal'
import { CompanyBoard, CompanyBoardSkeleton, type CompanyColumn, type CompanySubGroup } from '@/components/companies/company-board'
import { CompanyDetailSheet } from '@/components/companies/company-detail-sheet'
import { CompanyCard } from '@/components/companies/company-card'
import { CompanyToolbar } from '@/components/companies/company-toolbar'
import { useCompaniesView } from '@/hooks/use-companies-view'
import type { Company, CompanyGroup } from '@/types/tasks'

export default function CompaniesPage() {
  // Data
  const { data: companies, isLoading: companiesLoading, error: companiesError } = useCompanies()
  const { data: groups, isLoading: groupsLoading } = useCompanyGroups()
  const deleteCompanyMutation = useDeleteCompany()
  const deleteGroupMutation = useDeleteCompanyGroup()
  const updateCompanyMutation = useUpdateCompany()

  // View state (persisted to DB)
  const {
    viewMode, groupBy, subGroupBy, filters,
    setViewMode, setGroupBy, setSubGroupBy,
    setFilters, clearFilters,
  } = useCompaniesView()

  // UI State (ephemeral)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<CompanyGroup | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const isLoading = companiesLoading || groupsLoading
  const error = companiesError


  // ─── Filter companies ───────────────────────────────────

  const filteredCompanies = useMemo(() => {
    if (!companies) return []
    return companies.filter((c) => {
      if (filters.search) {
        const search = filters.search.toLowerCase()
        if (!c.name.toLowerCase().includes(search)) return false
      }
      if (filters.group_id === '_ungrouped') {
        if (c.group_id) return false
      } else if (filters.group_id) {
        if (c.group_id !== filters.group_id) return false
      }
      if (filters.ownership_type && c.ownership_type !== filters.ownership_type) return false
      if (filters.status && c.status !== filters.status) return false
      return true
    })
  }, [companies, filters])

  // ─── Build columns for kanban ───────────────────────────

  const columns = useMemo((): CompanyColumn[] => {
    const result: CompanyColumn[] = []

    switch (groupBy) {
      case 'group': {
        const groupMap = new Map<string, Company[]>()
        const ungrouped: Company[] = []

        for (const c of filteredCompanies) {
          if (c.group_id) {
            if (!groupMap.has(c.group_id)) groupMap.set(c.group_id, [])
            groupMap.get(c.group_id)!.push(c)
          } else {
            ungrouped.push(c)
          }
        }

        for (const group of groups ?? []) {
          const groupCompanies = groupMap.get(group.id) ?? []
          const hasActiveFilters = !!(filters.search || filters.ownership_type || filters.status)
          if (groupCompanies.length > 0 || !hasActiveFilters) {
            result.push({
              key: group.id,
              label: group.name,
              color: group.color || '#64748b',
              icon: group.icon,
              companies: groupCompanies,
              group,
            })
          }
        }

        if (ungrouped.length > 0 || !(filters.search || filters.ownership_type || filters.status)) {
          result.push({
            key: '_ungrouped',
            label: 'Sans groupe',
            color: '#64748b',
            icon: null,
            companies: ungrouped,
          })
        }
        break
      }

      case 'ownership': {
        for (const type of OWNERSHIP_TYPES) {
          const typeCompanies = filteredCompanies.filter(
            (c) => c.ownership_type === type.value
          )
          result.push({
            key: type.value,
            label: type.label,
            color: type.color,
            icon: null,
            companies: typeCompanies,
          })
        }
        break
      }

      case 'status': {
        for (const status of COMPANY_STATUSES) {
          const statusCompanies = filteredCompanies.filter(
            (c) => c.status === status.value
          )
          result.push({
            key: status.value,
            label: status.label,
            color: status.color,
            icon: null,
            companies: statusCompanies,
          })
        }
        break
      }

      case 'none': {
        result.push({
          key: '_all',
          label: 'Toutes les entreprises',
          color: '#64748b',
          icon: null,
          companies: filteredCompanies,
        })
        break
      }
    }

    // Apply sub-grouping
    if (subGroupBy !== 'none') {
      for (const col of result) {
        const subs = new Map<string, CompanySubGroup>()

        if (subGroupBy === 'ownership') {
          for (const t of OWNERSHIP_TYPES) {
            subs.set(t.value, { label: t.label, color: t.color, companies: [] })
          }
          for (const c of col.companies) {
            subs.get(c.ownership_type)?.companies.push(c)
          }
        } else if (subGroupBy === 'status') {
          for (const s of COMPANY_STATUSES) {
            subs.set(s.value, { label: s.label, color: s.color, companies: [] })
          }
          for (const c of col.companies) {
            subs.get(c.status)?.companies.push(c)
          }
        }

        // Remove empty sub-groups
        for (const [key, sub] of subs) {
          if (sub.companies.length === 0) subs.delete(key)
        }

        col.subGroups = subs
      }
    }

    return result
  }, [filteredCompanies, groups, groupBy, subGroupBy, filters])

  // ─── Handlers ─────────────────────────────────────────

  const confirmDeleteCompany = () => {
    if (!deleteTarget) return
    deleteCompanyMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    })
  }

  const confirmDeleteGroup = () => {
    if (!deleteGroupTarget) return
    deleteGroupMutation.mutate(deleteGroupTarget.id, {
      onSettled: () => setDeleteGroupTarget(null),
    })
  }

  const handleMoveCompany = (companyId: string, targetColumnKey: string) => {
    switch (groupBy) {
      case 'group':
        updateCompanyMutation.mutate({
          id: companyId,
          group_id: targetColumnKey === '_ungrouped' ? null : targetColumnKey,
        })
        break
      case 'ownership':
        updateCompanyMutation.mutate({
          id: companyId,
          ownership_type: targetColumnKey as Company['ownership_type'],
        })
        break
      case 'status':
        updateCompanyMutation.mutate({
          id: companyId,
          status: targetColumnKey as Company['status'],
        })
        break
      default:
        break
    }
  }

  const hasFilters = !!(filters.search || filters.group_id || filters.ownership_type || filters.status)
  const isEmpty = !isLoading && !error && filteredCompanies.length === 0

  return (
    <>
      {/* ─── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/20 backdrop-blur-md rounded-xl p-1.5 md:rounded-b-none md:p-0 md:border-b flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Entreprises</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
        {/* Toolbar */}
        <CompanyToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          subGroupBy={subGroupBy}
          setSubGroupBy={setSubGroupBy}
          filters={filters}
          setFilters={setFilters}
          clearFilters={clearFilters}
          groups={groups ?? []}
        />

        {/* Loading */}
        {isLoading && <CompanyBoardSkeleton />}

        {/* Error */}
        {error && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                <p>Erreur lors du chargement des entreprises</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <RefreshCw className="size-4" />
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {isEmpty && !hasFilters && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Building2 className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Aucune entreprise</p>
                  <p className="text-sm text-muted-foreground">
                    Créez votre première entreprise pour commencer
                  </p>
                </div>
                <CompanyModal
                  trigger={
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Nouvelle entreprise
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {isEmpty && hasFilters && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune entreprise ne correspond aux filtres
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Kanban view ───────────────────────────────── */}
        {!isLoading && !error && filteredCompanies.length > 0 && viewMode === 'kanban' && (
          <CompanyBoard
            columns={columns}
            groupBy={groupBy}
            onSelectCompany={setSelectedCompany}
            onDeleteCompany={setDeleteTarget}
            onDeleteGroup={setDeleteGroupTarget}
            onMoveCompany={handleMoveCompany}
          />
        )}

        {/* ─── Table/List view ───────────────────────────── */}
        {!isLoading && !error && filteredCompanies.length > 0 && viewMode === 'table' && (
          <div className="space-y-4">
            {columns.map((col) => {
              if (col.companies.length === 0 && groupBy !== 'none') return null
              return (
                <div key={col.key}>
                  {groupBy !== 'none' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: col.color }}
                      />
                      {col.icon && <span className="text-sm">{col.icon}</span>}
                      <span className="text-sm font-medium">{col.label}</span>
                      <span className="text-xs text-muted-foreground">
                        ({col.companies.length})
                      </span>
                    </div>
                  )}
                  <Card className="bg-card overflow-hidden">
                    {col.companies.map((company) => (
                      <CompanyCard
                        key={company.id}
                        company={company}
                        onDelete={setDeleteTarget}
                        variant="list"
                      />
                    ))}
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Delete company dialog ───────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer l&apos;entreprise
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;entreprise{' '}
              <strong>&quot;{deleteTarget?.name}&quot;</strong> ? Les projets associés
              seront dissociés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCompany}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCompanyMutation.isPending}
            >
              {deleteCompanyMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete group dialog ─────────────────────────── */}
      <AlertDialog
        open={!!deleteGroupTarget}
        onOpenChange={(open) => !open && setDeleteGroupTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer le groupe
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le groupe{' '}
              <strong>&quot;{deleteGroupTarget?.name}&quot;</strong> ? Les entreprises
              du groupe ne seront pas supprimées, elles deviendront &quot;sans groupe&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteGroupMutation.isPending}
            >
              {deleteGroupMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Detail sheet ────────────────────────────────── */}
      <CompanyDetailSheet
        company={selectedCompany}
        open={!!selectedCompany}
        onOpenChange={(open) => {
          if (!open) setSelectedCompany(null)
        }}
      />
    </>
  )
}
