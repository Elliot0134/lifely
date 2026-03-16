'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import {
  createCompanySchema,
  type CreateCompanyInput,
} from '@/lib/validations/tasks'
import {
  useCreateCompany,
  useUpdateCompany,
} from '@/lib/queries/companies'
import { COMPANY_STATUSES, PROJECT_COLORS } from '@/lib/constants'
import type { Company, CompanyStatus } from '@/types/tasks'

interface CompanyModalProps {
  trigger?: React.ReactNode
  company?: Company | null
}

export function CompanyModal({ trigger, company }: CompanyModalProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<CompanyStatus>(company?.status ?? 'not_started')
  const createMutation = useCreateCompany()
  const updateMutation = useUpdateCompany()

  const isEditMode = !!company

  const form = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: company?.name ?? '',
      color: company?.color ?? PROJECT_COLORS[0],
      icon: company?.icon ?? '',
    },
  })

  // Reset form when company changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: company?.name ?? '',
        color: company?.color ?? PROJECT_COLORS[0],
        icon: company?.icon ?? '',
      })
      setStatus(company?.status ?? 'not_started')
    }
  }, [open, company, form])

  const selectedColor = form.watch('color')

  const onSubmit = async (data: CreateCompanyInput) => {
    try {
      if (isEditMode && company) {
        await updateMutation.mutateAsync({
          id: company.id,
          name: data.name,
          color: data.color || null,
          icon: data.icon || null,
          status,
        })
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          color: data.color,
          icon: data.icon,
        })
      }
      setOpen(false)
    } catch {
      // Error is handled by mutation onError (toast)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const defaultTrigger = (
    <Button size="sm">
      <Plus className="mr-2 h-4 w-4" />
      Nouvelle entreprise
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l&apos;entreprise</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: ESST Solutions, Aurentia..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icone (emoji ou texte)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 🏢, 🚀, ES..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full justify-start font-normal"
                        >
                          <div
                            className="mr-2 h-4 w-4 rounded border"
                            style={{ backgroundColor: selectedColor }}
                          />
                          {selectedColor}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="grid grid-cols-4 gap-2">
                        {PROJECT_COLORS.map((color) => (
                          <Button
                            key={color}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 w-10 p-0"
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          >
                            {selectedColor === color && (
                              <span className="text-white text-sm">
                                ✓
                              </span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status (edit mode only) */}
            {isEditMode && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Statut
                </label>
                <Select
                  value={status}
                  onValueChange={(value: CompanyStatus) => setStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Preview */}
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">Previsualisation</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: (selectedColor || PROJECT_COLORS[0]) + '20',
                    color: selectedColor || PROJECT_COLORS[0],
                  }}
                >
                  {form.watch('icon') || form.watch('name')?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium">
                    {form.watch('name') || 'Nom de l\'entreprise'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          COMPANY_STATUSES.find((s) => s.value === status)?.color ??
                          'hsl(0 0% 63%)',
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {COMPANY_STATUSES.find((s) => s.value === status)?.label ?? 'Pas commence'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Modification...' : 'Creation...'}
                  </>
                ) : isEditMode ? (
                  'Modifier'
                ) : (
                  'Creer'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
