"use client"

import { useEffect, useState } from "react"

export default function ConnectionCountdown({
  departure
}: {
  departure: string | null
}) {

  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {

    if (!departure) return

    const update = () => {
        const now = Date.now()
      
        const departureDate = new Date(departure!)
      
        // convert UTC → local time
        const localDeparture =
          departureDate.getTime() + departureDate.getTimezoneOffset() * 60000
      
        const diff = localDeparture - now
      
        setRemaining(Math.max(0, Math.floor(diff / 1000)))
      }

    update()

    const interval = setInterval(update, 1000)

    return () => clearInterval(interval)

  }, [departure])

  if (remaining === null) return null

  const hours = Math.floor(remaining / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  
  return (
    <p className="text-lg font-semibold text-zinc-50">
      {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
    </p>
  )
}
