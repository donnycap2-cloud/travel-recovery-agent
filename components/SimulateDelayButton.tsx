"use client";

export default function SimulateDelayButton({ tripId }: { tripId: string }) {
  async function simulateDelay() {
    await fetch("/api/simulate-delay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tripId,
        delayMinutes: 25
      })
    });

    location.reload();
  }

  return (
    <button
      onClick={simulateDelay}
      className="inline-flex w-full items-center justify-center rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-600"
    >
      Simulate 25 min delay
    </button>
  );
}
