import { ComingSoon } from "@/components/coming-soon"
import { Stethoscope } from "lucide-react"

export default function AppointmentsPage() {
  return <ComingSoon title="RDV médicaux" description="Historique et prochains rendez-vous médicaux avec rappels automatiques." icon={Stethoscope} />
}
