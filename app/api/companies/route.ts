import { NextResponse } from "next/server";
import {
  companiesByOwner,
  createCompany,
  listCompanies,
} from "@/lib/db/catalog";
import { notifyAdminsNewVerificationRequest } from "@/lib/db/notifications";
import { isStaffAdminRole } from "@/lib/admin-staff";
import { requireSession } from "@/lib/server/require-session";
import { getSessionUser } from "@/lib/server/session";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pending = searchParams.get("pending") === "true";

  if (isStaffAdminRole(user.role)) {
    if (pending) {
      return NextResponse.json({
        companies: listCompanies().filter((c) => !c.isVerified),
      });
    }
    return NextResponse.json({ companies: listCompanies() });
  }

  if (user.role === "supplier") {
    return NextResponse.json({
      companies: companiesByOwner(user.id),
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const auth = await requireSession(["supplier"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const licenseDocument = body?.licenseDocument
    ? String(body.licenseDocument)
    : undefined;
  const businessAddress = body?.businessAddress
    ? String(body.businessAddress).trim()
    : undefined;
  const tinNumber = body?.tinNumber
    ? String(body.tinNumber).trim()
    : undefined;
  const tradeLicenseNumber = body?.tradeLicenseNumber
    ? String(body.tradeLicenseNumber).trim()
    : undefined;
  const tradeLicenseDocument = body?.tradeLicenseDocument
    ? String(body.tradeLicenseDocument).trim()
    : undefined;
  const latRaw = body?.latitude;
  const lngRaw = body?.longitude;
  const latitude =
    latRaw != null && latRaw !== ""
      ? Number(latRaw)
      : undefined;
  const longitude =
    lngRaw != null && lngRaw !== ""
      ? Number(lngRaw)
      : undefined;
  if (!name || !description) {
    return NextResponse.json({ error: "Name and description required" }, { status: 400 });
  }

  const company = createCompany({
    ownerId: auth.user.id,
    name,
    description,
    licenseDocument,
    businessAddress: businessAddress || undefined,
    latitude:
      latitude !== undefined && Number.isFinite(latitude)
        ? latitude
        : undefined,
    longitude:
      longitude !== undefined && Number.isFinite(longitude)
        ? longitude
        : undefined,
    tinNumber,
    tradeLicenseNumber,
    tradeLicenseDocument,
  });

  notifyAdminsNewVerificationRequest(auth.user.id, "company", name);

  return NextResponse.json({ company });
}
