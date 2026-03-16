import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-background/20 backdrop-blur-md rounded-xl p-1.5 md:rounded-none md:p-0 md:border-b flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Paramètres</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez votre profil et vos préférences
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* Profil */}
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" placeholder="Jean Dupont" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="jean@exemple.com" disabled />
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié
                </p>
              </div>
              <Button>Sauvegarder</Button>
            </CardContent>
          </Card>

          {/* Préférences */}
          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Thème</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Clair</Button>
                  <Button variant="outline" size="sm">Sombre</Button>
                  <Button variant="default" size="sm">Système</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Devise</Label>
                <div className="p-2 border rounded-md text-muted-foreground">
                  EUR (non modifiable)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compte */}
          <Card>
            <CardHeader>
              <CardTitle>Compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline">
                🔑 Changer le mot de passe
              </Button>
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-red-600 mb-2">Zone de danger</h4>
                <Button variant="destructive">
                  🗑️ Supprimer mon compte
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Cette action est irréversible. Toutes vos données seront supprimées.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Message */}
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Les paramètres seront fonctionnels une fois la base de données configurée.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}