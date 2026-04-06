import { NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/app-url";
import type { EthiopiaSearchHit } from "@/lib/location/ethiopia-location";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

function parseAddress(
  raw: Record<string, string | undefined> | undefined,
): Record<string, string> {
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v != null && String(v).trim()) out[k] = String(v).trim();
  }
  return out;
}

/**
 * GET ?q= — Ethiopia-only address search (OpenStreetMap Nominatim).
 * Proxied so we can set a proper User-Agent and rate-limit clients.
 */
export async function GET(request: Request) {
  const auth = await requireSession(["merchant", "supplier"]);
  if (!auth.ok) return auth.response;

  const ip = clientIp(request);
  const rl = checkRateLimit(`ethiopia-search:${ip}`, 45, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many location searches. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] as EthiopiaSearchHit[] });
  }

  const base = getPublicAppUrl();
  const userAgent = `LucyMerchant/1.0 (delivery; ${base})`;

  const url = new URL(NOMINATIM);
  url.searchParams.set("q", q);
  url.searchParams.set("countrycodes", "et");
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json",
        "Accept-Language": "en",
      },
      next: { revalidate: 0 },
    });
  } catch {
    return NextResponse.json(
      { error: "Location search failed. Try again." },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "Location search unavailable. Try again later." },
      { status: 502 },
    );
  }

  type NominatimRow = {
    display_name?: string;
    lat?: string;
    lon?: string;
    address?: Record<string, string | undefined>;
  };

  const rows = (await res.json()) as NominatimRow[];
  const results: EthiopiaSearchHit[] = (Array.isArray(rows) ? rows : []).map(
    (row) => ({
      displayName: String(row.display_name ?? "").trim(),
      lat: String(row.lat ?? ""),
      lon: String(row.lon ?? ""),
      address: parseAddress(row.address),
    }),
  );

  return NextResponse.json({ results });
}
