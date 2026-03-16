'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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

import { categorySchema, type CategoryInput } from '@/lib/validations/category'
import { createCategory } from '@/lib/actions/categories'
import { useUpdateCategory, categoryKeys } from '@/lib/queries'
import { useQueryClient } from '@tanstack/react-query'
import type { TransactionType } from '@/types'

interface CategoryData {
  id: string
  name: string
  icon: string | null
  color: string | null
  transaction_type: TransactionType
}

interface CategoryModalProps {
  trigger?: React.ReactNode
  category?: CategoryData | null
}

// Available emoji icons for categories
const AVAILABLE_ICONS = [
  '🏠', '🚗', '🍔', '🛒', '💊', '⚡', '📱', '🎬', '👕', '✈️',
  '💰', '🎯', '📚', '☕', '🏋️', '🎮', '🎸', '💻', '🏥', '⛽',
  '🍕', '🚌', '💳', '🎁', '🧾', '📊', '🏦', '💼', '🎪', '🌟',
]

// Predefined color palette
const AVAILABLE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
]

export function CategoryModal({ trigger, category }: CategoryModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const updateMutation = useUpdateCategory()
  const queryClient = useQueryClient()

  const isEditMode = !!category

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      icon: category?.icon || '🏠',
      color: category?.color || '#3b82f6',
      type: category?.transaction_type || 'variable_expense',
    },
  })

  // Reset form when category changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name || '',
        icon: category?.icon || '🏠',
        color: category?.color || '#3b82f6',
        type: category?.transaction_type || 'variable_expense',
      })
    }
  }, [open, category, form])

  const selectedIcon = form.watch('icon')
  const selectedColor = form.watch('color')
  const selectedType = form.watch('type')

  const onSubmit = async (data: CategoryInput) => {
    setIsSubmitting(true)
    try {
      if (isEditMode && category) {
        // Update via API
        await updateMutation.mutateAsync({
          id: category.id,
          data: {
            name: data.name,
            icon: data.icon,
            color: data.color,
            transaction_type: data.type,
          },
        })
        setOpen(false)
      } else {
        // Create via Server Action
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString())
          }
        })

        const result = await createCategory(formData)

        if (result.success) {
          toast.success('Categorie creee avec succes')
          // Invalidate categories query to refresh list
          queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
          form.reset()
          setOpen(false)
        } else {
          toast.error(result.error || 'Erreur lors de la creation')
        }
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde de la categorie')
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultTrigger = (
    <Button size="sm">
      <Plus className="mr-2 h-4 w-4" />
      Nouvelle categorie
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier la categorie' : 'Nouvelle categorie'}
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
                  <FormLabel>Nom de la categorie</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Alimentation, Transport..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="revenue">Revenus</SelectItem>
                      <SelectItem value="variable_expense">
                        Depenses variables
                      </SelectItem>
                      <SelectItem value="fixed_expense">
                        Charges fixes
                      </SelectItem>
                      <SelectItem value="credit">Credits</SelectItem>
                      <SelectItem value="savings">Epargne</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <FormLabel>Icone</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full justify-start font-normal"
                        >
                          <span className="mr-2 text-lg">{selectedIcon}</span>
                          Choisir une icone
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid grid-cols-6 gap-2">
                        {AVAILABLE_ICONS.map((icon) => (
                          <Button
                            key={icon}
                            type="button"
                            variant={
                              selectedIcon === icon ? 'default' : 'outline'
                            }
                            size="sm"
                            className="h-10 w-10"
                            onClick={() => field.onChange(icon)}
                          >
                            <span className="text-lg">{icon}</span>
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
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
                        {AVAILABLE_COLORS.map((color) => (
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

            {/* Preview */}
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">Previsualisation</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{
                    backgroundColor: selectedColor + '20',
                  }}
                >
                  <span>{selectedIcon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <p className="font-medium">
                      {form.watch('name') || 'Nom de la categorie'}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedType === 'revenue' && 'Revenus'}
                    {selectedType === 'variable_expense' &&
                      'Depenses variables'}
                    {selectedType === 'fixed_expense' && 'Charges fixes'}
                    {selectedType === 'credit' && 'Credits'}
                    {selectedType === 'savings' && 'Epargne'}
                  </p>
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
