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
      const diff =
        new Date(departure).getTime() - new Date().getTime()

      setRemaining(Math.max(0, Math.floor(diff / 1000)))
    }

    update()

    const interval = setInterval(update, 1000)

    return () => clearInterval(interval)

  }, [departure])

  if (remaining === null) return null

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <p className="text-lg font-semibold text-zinc-50">
      {minutes}:{seconds.toString().padStart(2, "0")}
    </p>
  )
}
