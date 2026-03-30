import { Construction } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface ComingSoonProps {
  title: string
  description: string
  icon?: LucideIcon
}

export function ComingSoon({ title, description, icon: Icon = Construction }: ComingSoonProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-6">
          <Icon className="size-7 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Construction className="size-3.5" />
          À venir
        </div>
      </div>
    </div>
  )
}
