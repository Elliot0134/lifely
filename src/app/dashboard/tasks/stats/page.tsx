import { redirect } from 'next/navigation'

export default function LegacyTaskStatsPage() {
  redirect('/tasks/stats')
}
