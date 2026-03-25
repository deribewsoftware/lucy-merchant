import { NextResponse } from "next/server";
import {
  getMongoClientPromise,
  isMongoConfigured,
} from "@/lib/mongodb";

export const runtime = "nodejs";

/**
 * Verifies MongoDB Atlas connectivity (uses `ping`).
 * Does not expose secrets. Safe to call after setting `MONGODB_URI`.
 */
export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        ok: false,
        message: "MONGODB_URI is not set",
      },
      { status: 503 },
    );
  }

  try {
    const client = await getMongoClientPromise();
    await client.db("admin").command({ ping: 1 });
    return NextResponse.json({
      configured: true,
      ok: true,
      message: "MongoDB reachable",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Connection failed";
    return NextResponse.json(
      {
        configured: true,
        ok: false,
        message,
      },
      { status: 503 },
    );
  }
}
