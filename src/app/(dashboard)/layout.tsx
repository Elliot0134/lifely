import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirection si non authentifié
  if (!user) {
    redirect('/login')
  }

  // Récupérer le profil utilisateur pour la sidebar
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const userData = {
    name: profile?.full_name || user.email?.split('@')[0] || 'Utilisateur',
    email: user.email || '',
    avatar: profile?.avatar_url,
  }

  // Expanded unless the user collapsed it (cookie written by SidebarProvider)
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false'

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="bg-sidebar">
      <AppSidebar user={userData} />
      <SidebarInset className="min-w-0 pb-20 md:m-2 md:ml-0 md:rounded-xl md:pb-0">
        {children}
      </SidebarInset>
      <MobileBottomNav />
    </SidebarProvider>
  )
}
