import { NextResponse } from "next/server";

/** Basic liveness check for load balancers / uptime monitors (no DB). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "lucy-merchant",
    time: new Date().toISOString(),
  });
}
