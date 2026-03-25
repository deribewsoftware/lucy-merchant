import { NextResponse } from "next/server";
import { PLATFORM_BANK_ACCOUNTS } from "@/lib/data/ethiopian-banks";

export async function GET() {
  return NextResponse.json({ banks: PLATFORM_BANK_ACCOUNTS });
}
