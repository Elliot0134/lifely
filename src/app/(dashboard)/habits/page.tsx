import { redirect } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { HabitFormModal } from '@/components/habits/habit-form-modal'
import { HabitsViewToggle } from '@/components/habits/habits-view-toggle'
import { HabitsPageClient } from '@/components/habits/habits-page-client'

export const metadata = {
  title: 'Habitudes — LIFELY',
}

export default async function HabitsPage() {
  // Auth guard (defense-in-depth — le layout fait déjà la redirection)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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
                <BreadcrumbPage>Habitudes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Habitudes</h1>
            <p className="text-muted-foreground">
              Suivez vos habitudes quotidiennes
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HabitsViewToggle />
            <HabitFormModal
              mode="create"
              trigger={
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une habitude
                </Button>
              }
            />
          </div>
        </div>

        <HabitsPageClient />
      </div>
    </>
  )
}
