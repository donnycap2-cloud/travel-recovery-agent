import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const delayMs = Number(request.nextUrl.searchParams.get("ms")) || 1000;
  const clamped = Math.min(Math.max(0, delayMs), 30000); // 0–30s
  await new Promise((r) => setTimeout(r, clamped));
  return Response.json({ delayed: clamped });
}

export async function POST(request: NextRequest) {
  let delayMs = 1000;
  try {
    const body = await request.json();
    if (typeof body?.ms === "number") delayMs = body.ms;
  } catch {
    // ignore
  }
  const clamped = Math.min(Math.max(0, delayMs), 30000);
  await new Promise((r) => setTimeout(r, clamped));
  return Response.json({ delayed: clamped });
}
