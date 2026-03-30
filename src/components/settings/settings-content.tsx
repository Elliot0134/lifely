"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"
import { User, Settings, Shield, Database } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ProfileTab } from "./profile-tab"
import { PreferencesTab } from "./preferences-tab"
import { SecurityTab } from "./security-tab"
import { DataTab } from "./data-tab"

const SETTINGS_TABS = [
  { value: "profile", label: "Profil", icon: User },
  { value: "preferences", label: "Preferences", icon: Settings },
  { value: "security", label: "Securite", icon: Shield },
  { value: "data", label: "Donnees", icon: Database },
] as const

type SettingsTab = (typeof SETTINGS_TABS)[number]["value"]

const VALID_TABS = new Set<string>(SETTINGS_TABS.map((t) => t.value))

function isValidTab(value: string | null): value is SettingsTab {
  return value !== null && VALID_TABS.has(value)
}

export function SettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const rawTab = searchParams.get("tab")
  const activeTab: SettingsTab = isValidTab(rawTab) ? rawTab : "profile"

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === "profile") {
        params.delete("tab")
      } else {
        params.set("tab", value)
      }
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Parametres</h1>
        <p className="text-muted-foreground">
          Gerez votre profil et vos preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-none">
          <TabsList className="w-full sm:w-auto">
            {SETTINGS_TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-2">
                <Icon className="size-4" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="data">
          <DataTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
