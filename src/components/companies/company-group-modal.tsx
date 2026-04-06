'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2, FolderOpen } from 'lucide-react'

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
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import {
  createCompanyGroupSchema,
  type CreateCompanyGroupInput,
} from '@/lib/validations/tasks'
import {
  useCreateCompanyGroup,
  useUpdateCompanyGroup,
} from '@/lib/queries/company-groups'
import { PROJECT_COLORS } from '@/lib/constants'
import type { CompanyGroup } from '@/types/tasks'

interface CompanyGroupModalProps {
  trigger?: React.ReactNode
  group?: CompanyGroup | null
  onSuccess?: () => void
}

export function CompanyGroupModal({ trigger, group, onSuccess }: CompanyGroupModalProps) {
  const [open, setOpen] = useState(false)
  const createMutation = useCreateCompanyGroup()
  const updateMutation = useUpdateCompanyGroup()

  const isEditMode = !!group

  const form = useForm<CreateCompanyGroupInput>({
    resolver: zodResolver(createCompanyGroupSchema),
    defaultValues: {
      name: group?.name ?? '',
      color: group?.color ?? PROJECT_COLORS[0],
      icon: group?.icon ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: group?.name ?? '',
        color: group?.color ?? PROJECT_COLORS[0],
        icon: group?.icon ?? '',
      })
    }
  }, [open, group, form])

  const selectedColor = form.watch('color')

  const onSubmit = async (data: CreateCompanyGroupInput) => {
    try {
      if (isEditMode && group) {
        await updateMutation.mutateAsync({
          id: group.id,
          name: data.name,
          color: data.color || null,
          icon: data.icon || null,
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      setOpen(false)
      onSuccess?.()
    } catch {
      // Error handled by mutation onError (toast)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <FolderOpen className="mr-2 h-4 w-4" />
      Nouveau groupe
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier le groupe' : 'Nouveau groupe'}
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
                  <FormControl>
                    <Input
                      placeholder="Nom du groupe (ex: Aurentia, Clients...)"
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
                  <FormControl>
                    <Input placeholder="Icône (ex: 📁, 🏢, AU...)" {...field} />
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
                              <span className="text-white text-sm">✓</span>
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

            {/* Preview */}
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">Prévisualisation</p>
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
                <p className="font-medium">
                  {form.watch('name') || 'Nom du groupe'}
                </p>
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
                    {isEditMode ? 'Modification...' : 'Création...'}
                  </>
                ) : isEditMode ? (
                  'Modifier'
                ) : (
                  'Créer'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
