import { ComingSoon } from "@/components/coming-soon"
import { CalendarClock } from "lucide-react"

export default function PlanningPage() {
  return <ComingSoon title="Planning" description="Planifiez votre semaine en blocs de temps, synchronisés avec Google Calendar." icon={CalendarClock} />
}
