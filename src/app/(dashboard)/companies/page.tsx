'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Edit, Trash2, Plus, AlertTriangle, Building2 } from 'lucide-react'

import { useCompanies, useDeleteCompany } from '@/lib/queries/companies'
import { COMPANY_STATUSES } from '@/lib/constants'
import { CompanyModal } from '@/components/companies/company-modal'
import type { Company } from '@/types/tasks'

const STATUS_BADGE_CLASSES: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/15 text-green-600',
  completed: 'bg-blue-500/15 text-blue-600',
}

export default function CompaniesPage() {
  const { data: companies, isLoading, error } = useCompanies()
  const deleteMutation = useDeleteCompany()
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    })
  }

  const getStatusLabel = (status: string) =>
    COMPANY_STATUSES.find((s) => s.value === status)?.label ?? status

  const getStatusColor = (status: string) =>
    COMPANY_STATUSES.find((s) => s.value === status)?.color ?? 'hsl(0 0% 63%)'

  return (
    <>
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
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Entreprises</h1>
            <p className="text-muted-foreground">
              Gerez vos entreprises et organisez vos projets
            </p>
          </div>
          <CompanyModal />
        </div>

        {/* Error state */}
        {error && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>Erreur lors du chargement des entreprises</p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="mt-2"
                >
                  Reessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && companies && companies.length === 0 && (
          <Card className="bg-card">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-1">Aucune entreprise</p>
                <p className="text-sm mb-4">
                  Creez votre premiere entreprise pour organiser vos projets
                </p>
                <CompanyModal
                  trigger={
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Creer une entreprise
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company grid */}
        {!isLoading && !error && companies && companies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => {
              const statusBadgeClass =
                STATUS_BADGE_CLASSES[company.status] ?? STATUS_BADGE_CLASSES.not_started

              return (
                <Card
                  key={company.id}
                  className="bg-card group relative overflow-hidden"
                >
                  {/* Color indicator bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: company.color || '#64748b' }}
                  />

                  <CardContent className="p-5 pt-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
                        style={{
                          backgroundColor: (company.color || '#64748b') + '20',
                          color: company.color || '#64748b',
                        }}
                      >
                        {company.icon || company.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{company.name}</p>

                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-2 py-0 font-medium ${statusBadgeClass}`}
                          >
                            <div
                              className="h-1.5 w-1.5 rounded-full mr-1"
                              style={{ backgroundColor: getStatusColor(company.status) }}
                            />
                            {getStatusLabel(company.status)}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          {company.project_count ?? 0} projet{(company.project_count ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <CompanyModal
                          company={company}
                          trigger={
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(company)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
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
              Etes-vous sur de vouloir supprimer l&apos;entreprise{' '}
              <strong>&quot;{deleteTarget?.name}&quot;</strong> ? Cette action
              est irreversible. Les projets associes seront dissocies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
