'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { z } from 'zod'

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
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'

import {
  createProjectSchema,
  type CreateProjectInput,
} from '@/lib/validations/tasks'
import { useCreateProject, useUpdateProject } from '@/lib/queries/task-projects'
import { useCompanies } from '@/lib/queries/companies'
import { PROJECT_COLORS, PROJECT_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types/tasks'

interface ProjectModalProps {
  project?: Project
  trigger?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

export function ProjectModal({
  project,
  trigger,
  onOpenChange,
  defaultOpen = false,
}: ProjectModalProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [startDate, setStartDate] = useState<Date | undefined>(
    project?.start_date ? new Date(project.start_date) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    project?.end_date ? new Date(project.end_date) : undefined
  )

  const isEditing = !!project
  const { data: companies } = useCompanies()
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()

  // Extend create schema with optional status for edit mode
  const formSchema = isEditing
    ? createProjectSchema.extend({ status: z.enum(['not_started', 'in_progress', 'completed']).optional() })
    : createProjectSchema

  type FormValues = CreateProjectInput & { status?: ProjectStatus }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      company_id: project?.company_id ?? undefined,
      color: project?.color ?? undefined,
      start_date: project?.start_date ?? undefined,
      end_date: project?.end_date ?? undefined,
      ...(isEditing ? { status: project.status } : {}),
    },
  })

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description ?? '',
        company_id: project.company_id ?? undefined,
        color: project.color ?? undefined,
        start_date: project.start_date ?? undefined,
        end_date: project.end_date ?? undefined,
        status: project.status,
      })
      setStartDate(project.start_date ? new Date(project.start_date) : undefined)
      setEndDate(project.end_date ? new Date(project.end_date) : undefined)
    }
  }, [project, form])

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
    if (!value) {
      form.reset()
      setStartDate(undefined)
      setEndDate(undefined)
    }
  }

  const onSubmit = async (data: CreateProjectInput & { status?: ProjectStatus }) => {
    try {
      // Clean up empty optional fields
      const cleanData = {
        ...data,
        description: data.description || undefined,
        company_id: data.company_id || undefined,
        color: data.color || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
      }

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: project.id,
          ...cleanData,
        })
      } else {
        await createMutation.mutateAsync(cleanData)
      }
      handleOpenChange(false)
    } catch {
      // Error already handled by mutation hooks via toast
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const selectedColor = form.watch('color')

  const defaultTrigger = (
    <Button size="sm">
      <Plus className="mr-2 h-4 w-4" />
      Nouveau projet
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le projet' : 'Nouveau projet'}
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
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mon projet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description du projet..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company */}
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entreprise</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === '__none__' ? undefined : value)
                    }
                    value={field.value ?? '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Aucune entreprise" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Aucune entreprise</SelectItem>
                      {companies?.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          <span className="flex items-center gap-2">
                            {company.color && (
                              <span
                                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: company.color }}
                              />
                            )}
                            {company.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Picker */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            field.onChange(field.value === color ? undefined : color)
                          }
                          className={cn(
                            'h-7 w-7 rounded-full transition-all border-2',
                            selectedColor === color
                              ? 'border-foreground scale-110'
                              : 'border-transparent hover:scale-105'
                          )}
                          style={{ backgroundColor: color }}
                          aria-label={`Couleur ${color}`}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status (edit only) */}
            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Statut du projet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              {status.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de debut</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'dd/MM/yyyy')
                            ) : (
                              <span>Debut</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            if (date) {
                              setStartDate(date)
                              field.onChange(format(date, 'yyyy-MM-dd'))
                            } else {
                              setStartDate(undefined)
                              field.onChange(undefined)
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'dd/MM/yyyy')
                            ) : (
                              <span>Fin</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            if (date) {
                              setEndDate(date)
                              field.onChange(format(date, 'yyyy-MM-dd'))
                            } else {
                              setEndDate(undefined)
                              field.onChange(undefined)
                            }
                          }}
                          disabled={(date) =>
                            startDate ? date < startDate : false
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Mise a jour...' : 'Creation...'}
                  </>
                ) : isEditing ? (
                  'Mettre a jour'
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
