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

  return (
    <SidebarProvider>
      <AppSidebar user={userData} />
      <SidebarInset className="flex-1 pb-20 md:pb-0">
        {children}
      </SidebarInset>
      <MobileBottomNav />
    </SidebarProvider>
  )
}