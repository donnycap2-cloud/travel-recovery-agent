"use client"

import { useEffect, useState } from "react"

function formatMinutes(minutes: number) {
    const abs = Math.abs(minutes)
  
    const h = Math.floor(abs / 60)
    const m = abs % 60
  
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

export default function ConnectionCountdown({
    departure,
    arrival
  }: {
    departure: string | null
    arrival: string | null
  }) {

    const [remaining, setRemaining] = useState<{
        timeToDeparture: number
        connectionMargin: number
      } | null>(null)

      useEffect(() => {

        console.log("COUNTDOWN INPUT", {
          departure,
          arrival,
          now: new Date().toISOString()
        });
      
        if (!departure) return
      
        const update = () => {

          console.log("PARSED TIMES", {
            departureRaw: departure,
            departureParsed: new Date(departure!).toISOString(),
            departureMs: new Date(departure!).getTime(),
            nowMs: Date.now()
          });
        
          if (!departure || !arrival) return
    
      const now = Date.now();
    
      const departureTime = new Date(departure).getTime();
      const arrivalTime = new Date(arrival).getTime();
    
      console.log("COUNTDOWN CHECK", {
        departure,
        departureTime,
        now,
        diffMinutes: Math.floor((departureTime - now) / 60000)
      });

      const timeToDeparture = departureTime - now;
      const connectionMargin = departureTime - arrivalTime;
    
      setRemaining({
        timeToDeparture: Math.max(0, Math.floor(timeToDeparture / 1000)),
        connectionMargin: Math.floor(connectionMargin / 60000)
      });
    };

    update()

    const interval = setInterval(update, 1000)

    return () => clearInterval(interval)

  }, [departure, arrival])

  if (!remaining) return null

  const hours = Math.floor(remaining.timeToDeparture / 3600)
  const minutes = Math.floor((remaining.timeToDeparture % 3600) / 60)
  
  const margin = remaining.connectionMargin
  
  return (
<div className="space-y-1">
  <p className="text-lg font-semibold text-zinc-50">
    {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} until departure
  </p>

  <p
    className={`text-sm font-medium ${
      margin < 0
        ? "text-red-400"
        : margin < 30
        ? "text-yellow-400"
        : "text-green-400"
    }`}
  >
    {margin < 0
    ? `Connection missed by ${formatMinutes(margin)}`
    : `${formatMinutes(margin)} connection`}
  </p>
</div>
  )
}
