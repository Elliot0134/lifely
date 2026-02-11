'use client'

import { useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PeriodFilter } from '@/types'

export function usePeriodFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // Lire les paramètres URL ou utiliser les valeurs actuelles
  const [period, setPeriodState] = useState<PeriodFilter>({
    month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : currentMonth,
    year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : currentYear,
  })

  const setPeriod = useCallback((newPeriod: PeriodFilter) => {
    setPeriodState(newPeriod)

    // Mettre à jour l'URL
    const params = new URLSearchParams(searchParams.toString())

    if (newPeriod.month) {
      params.set('month', newPeriod.month.toString())
    } else {
      params.delete('month')
    }

    params.set('year', newPeriod.year.toString())

    router.replace(`?${params.toString()}`)
  }, [router, searchParams])

  const setMonth = useCallback((month: number | null) => {
    setPeriod({ ...period, month })
  }, [period, setPeriod])

  const setYear = useCallback((year: number) => {
    setPeriod({ ...period, year })
  }, [period, setPeriod])

  const isYearView = period.month === null

  const getDateRange = useCallback(() => {
    if (isYearView) {
      return {
        from: `${period.year}-01-01`,
        to: `${period.year}-12-31`,
      }
    } else {
      const lastDay = new Date(period.year, period.month!, 0).getDate()
      const monthStr = period.month!.toString().padStart(2, '0')
      return {
        from: `${period.year}-${monthStr}-01`,
        to: `${period.year}-${monthStr}-${lastDay}`,
      }
    }
  }, [period, isYearView])

  return {
    period,
    setPeriod,
    setMonth,
    setYear,
    isYearView,
    getDateRange,
  }
}