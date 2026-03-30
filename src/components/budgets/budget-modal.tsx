'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'

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
import { Calendar as CalendarComponent } from '@/components/ui/calendar'

import { budgetSchema, type BudgetInput } from '@/lib/validations/budget'
import { createBudget } from '@/lib/actions/budgets'
import { useCategories, useAccounts } from '@/lib/queries'
import { formatCurrency, cn, formatDate } from '@/lib/utils'

interface BudgetModalProps {
  trigger?: React.ReactNode
}

export function BudgetModal({ trigger }: BudgetModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()))

  const { data: categoriesData } = useCategories()
  const { data: accountsData } = useAccounts()

  // Filtrer seulement les catégories de dépenses pour les budgets
  const categories = (categoriesData?.data || []).filter(
    (cat: any) => cat.transaction_type === 'variable_expense' || cat.transaction_type === 'fixed_expense'
  )
  const accounts = accountsData?.data || []

  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category_id: '',
      account_id: '',
      amount: 0,
      period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    },
  })

  const onSubmit = (data: BudgetInput) => {
    startTransition(async () => {
      try {
        const formData = new FormData()

        // Convertir les données en FormData
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString())
          }
        })

        const result = await createBudget(formData)

        if (result.success) {
          toast.success('Budget créé avec succès')
          form.reset()
          setOpen(false)
          // Reset dates
          setStartDate(startOfMonth(new Date()))
          setEndDate(endOfMonth(new Date()))
        } else {
          toast.error(result.error || 'Erreur lors de la création')
        }
      } catch (error) {
        toast.error('Erreur lors de la création du budget')
      }
    })
  }

  // Helpers pour les périodes prédéfinies
  const setCurrentMonth = () => {
    const start = startOfMonth(new Date())
    const end = endOfMonth(new Date())
    setStartDate(start)
    setEndDate(end)
    form.setValue('period_start', format(start, 'yyyy-MM-dd'))
    form.setValue('period_end', format(end, 'yyyy-MM-dd'))
  }

  const setNextMonth = () => {
    const start = startOfMonth(addMonths(new Date(), 1))
    const end = endOfMonth(addMonths(new Date(), 1))
    setStartDate(start)
    setEndDate(end)
    form.setValue('period_start', format(start, 'yyyy-MM-dd'))
    form.setValue('period_end', format(end, 'yyyy-MM-dd'))
  }

  const defaultTrigger = (
    <Button size="sm">
      <Plus className="mr-2 h-4 w-4" />
      Nouveau budget
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau budget</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Catégorie */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span>{category.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Compte */}
            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compte</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un compte" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account: any) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Montant */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant du budget</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Période - Raccourcis rapides */}
            <div className="space-y-2">
              <FormLabel>Période</FormLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setCurrentMonth}
                  className="flex-1"
                >
                  Ce mois
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setNextMonth}
                  className="flex-1"
                >
                  Mois prochain
                </Button>
              </div>
            </div>

            {/* Date de début */}
            <FormField
              control={form.control}
              name="period_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de début</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDate(new Date(field.value))
                          ) : (
                            <span>Sélectionner la date de début</span>
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

            {/* Date de fin */}
            <FormField
              control={form.control}
              name="period_end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de fin</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDate(new Date(field.value))
                          ) : (
                            <span>Sélectionner la date de fin</span>
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
                          }
                        }}
                        disabled={(date) => startDate ? date < startDate : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
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