"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type HabitsView = "week" | "month"

export function HabitsViewToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const current: HabitsView =
    searchParams.get("view") === "month" ? "month" : "week"

  const setView = (v: HabitsView) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", v)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <ToggleGroup
      type="single"
      value={current}
      onValueChange={(value) => {
        if (value === "week" || value === "month") {
          setView(value)
        }
      }}
      variant="outline"
      aria-label="Vue des habitudes"
    >
      <ToggleGroupItem value="week" aria-label="Vue hebdomadaire">
        Semaine
      </ToggleGroupItem>
      <ToggleGroupItem value="month" aria-label="Vue mensuelle">
        Mois
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
