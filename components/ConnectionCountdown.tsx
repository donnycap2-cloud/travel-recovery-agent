"use client";

import { useEffect, useState } from "react";
import { parseLocalTime } from "@/lib/time";

function formatMinutes(minutes: number) {
  const abs = Math.abs(minutes);

  const h = Math.floor(abs / 60);
  const m = abs % 60;

  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ConnectionCountdown({
  departure,
  arrival,
  airport
}: {
  departure: string | null;
  arrival: string | null;
  airport: string;
}) {

  const [remaining, setRemaining] = useState<{
    timeToDeparture: number;
    connectionMargin: number;
  } | null>(null);

  useEffect(() => {
    console.log("COUNTDOWN INPUT", {
      departure,
      arrival,
      airport,
      now: new Date().toISOString()
    });

    // ✅ REQUIRE BOTH VALUES
    if (!departure || !arrival) {
      console.log("❌ Missing countdown inputs");
      return;
    }

    const update = () => {
      const now = Date.now();

      const departureTime = parseLocalTime(departure);
      const arrivalTime = parseLocalTime(arrival);

      // ✅ FIXED: proper null check
      if (departureTime === null || arrivalTime === null) {
        console.log("❌ Null parsed times");
        return;
      }

      // ✅ validate numbers
      if (Number.isNaN(departureTime) || Number.isNaN(arrivalTime)) {
        console.log("❌ Invalid date parsing");
        return;
      }

      console.log("PARSED TIMES", {
        departureRaw: departure,
        departureMs: departureTime,
        arrivalMs: arrivalTime,
        nowMs: now
      });

      const diffMinutes = Math.floor((departureTime - now) / 60000);

      console.log("COUNTDOWN CHECK", {
        diffMinutes
      });

      const timeToDeparture = departureTime - now;
      const connectionMargin = departureTime - arrivalTime;

      setRemaining({
        timeToDeparture: Math.max(0, Math.floor(timeToDeparture / 1000)),
        connectionMargin: Math.floor(connectionMargin / 60000)
      });
    };

    update();
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);

  }, [departure, arrival, airport]);

  if (!remaining) return null;

  const hours = Math.floor(remaining.timeToDeparture / 3600);
  const minutes = Math.floor((remaining.timeToDeparture % 3600) / 60);

  const margin = remaining.connectionMargin;

  return (
    <div className="space-y-1">
      <p className="text-lg font-semibold text-zinc-50">
       {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} until departure from {airport}
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
  );
}