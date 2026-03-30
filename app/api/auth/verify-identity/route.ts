import path from "path";
import { NextResponse } from "next/server";
import {
  findActiveUserWithSameFaydaFan,
  submitNationalIdVerification,
} from "@/lib/db/users";
import { notifyAdminsNewVerificationRequest } from "@/lib/db/notifications";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";
import {
  FAYDA_ALLOWED_IMAGE_EXTENSIONS,
  FAYDA_MAX_IMAGE_BYTES,
  validateFaydaVerificationText,
} from "@/lib/validation/fayda-fcn";
import { isUploadedAssetPath, writeBufferToUpload } from "@/lib/server/upload-path";

export const runtime = "nodejs";

const ALLOWED = new Set<string>(FAYDA_ALLOWED_IMAGE_EXTENSIONS);
const SUBDIR = "fayda-id";

function parseOptional(s: unknown): string | undefined {
  const t = String(s ?? "").trim();
  return t || undefined;
}

function jsonValidationError(errors: string[]) {
  return NextResponse.json(
    { error: errors[0], errors },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const auth = await requireSession(["merchant", "supplier"]);
  if (!auth.ok) return auth.response;

  const rl = checkRateLimit(`idverify:${auth.user.id}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const ct = request.headers.get("content-type") ?? "";

  let nationalIdName: string;
  let nationalIdFanRaw: string;
  let nationalIdFrontImage: string;
  let nationalIdBackImage: string;
  let nationalIdCity: string;
  let nationalIdSubcity: string | undefined;
  let nationalIdWoreda: string | undefined;
  let nationalIdPhoneOnId: string | undefined;
  let nationalIdAddressLine: string | undefined;

  let fan: string;

  if (ct.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    nationalIdName = String(form.get("nationalIdName") ?? "").trim();
    nationalIdFanRaw = String(form.get("nationalIdFan") ?? "").trim();
    nationalIdCity = String(form.get("nationalIdCity") ?? "").trim();
    nationalIdSubcity = parseOptional(form.get("nationalIdSubcity"));
    nationalIdWoreda = parseOptional(form.get("nationalIdWoreda"));
    nationalIdPhoneOnId = parseOptional(form.get("nationalIdPhoneOnId"));
    nationalIdAddressLine = parseOptional(form.get("nationalIdAddressLine"));

    const textRes = validateFaydaVerificationText({
      nationalIdFan: nationalIdFanRaw,
      nationalIdName,
      nationalIdCity,
      nationalIdSubcity,
      nationalIdWoreda,
      nationalIdPhoneOnId,
      nationalIdAddressLine,
    });
    if (!textRes.ok) {
      return jsonValidationError(textRes.errors);
    }
    fan = textRes.fan;

    const front = form.get("frontImage");
    const back = form.get("backImage");
    if (!front || !(front instanceof Blob)) {
      return NextResponse.json(
        { error: "Front of ID image is required.", errors: ["Front of ID image is required."] },
        { status: 400 },
      );
    }
    if (!back || !(back instanceof Blob)) {
      return NextResponse.json(
        { error: "Back of ID image is required.", errors: ["Back of ID image is required."] },
        { status: 400 },
      );
    }
    if (front.size > FAYDA_MAX_IMAGE_BYTES || back.size > FAYDA_MAX_IMAGE_BYTES) {
      const maxMb = FAYDA_MAX_IMAGE_BYTES / (1024 * 1024);
      return NextResponse.json(
        {
          error: `Each image must be ${maxMb}MB or less.`,
          errors: [`Each image must be ${maxMb}MB or less.`],
        },
        { status: 400 },
      );
    }

    const savedFront = await saveIdImageFile(front, auth.user.id, "front");
    if (!savedFront.ok) {
      return NextResponse.json(
        { error: savedFront.error, errors: [savedFront.error] },
        { status: 400 },
      );
    }
    const savedBack = await saveIdImageFile(back, auth.user.id, "back");
    if (!savedBack.ok) {
      return NextResponse.json(
        { error: savedBack.error, errors: [savedBack.error] },
        { status: 400 },
      );
    }
    nationalIdFrontImage = savedFront.publicPath;
    nationalIdBackImage = savedBack.publicPath;
  } else {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    nationalIdName = String(body?.nationalIdName ?? "").trim();
    nationalIdFanRaw = String(body?.nationalIdFan ?? "").trim();
    nationalIdFrontImage = String(body?.nationalIdFrontImage ?? "").trim();
    nationalIdBackImage = String(body?.nationalIdBackImage ?? "").trim();
    nationalIdCity = String(body?.nationalIdCity ?? "").trim();
    nationalIdSubcity = parseOptional(body?.nationalIdSubcity);
    nationalIdWoreda = parseOptional(body?.nationalIdWoreda);
    nationalIdPhoneOnId = parseOptional(body?.nationalIdPhoneOnId);
    nationalIdAddressLine = parseOptional(body?.nationalIdAddressLine);

    const textRes = validateFaydaVerificationText({
      nationalIdFan: nationalIdFanRaw,
      nationalIdName,
      nationalIdCity,
      nationalIdSubcity,
      nationalIdWoreda,
      nationalIdPhoneOnId,
      nationalIdAddressLine,
    });
    if (!textRes.ok) {
      return jsonValidationError(textRes.errors);
    }
    fan = textRes.fan;

    if (!nationalIdFrontImage || !nationalIdBackImage) {
      return NextResponse.json(
        {
          error: "Both front and back Digital ID image URLs are required.",
          errors: ["Both front and back Digital ID image URLs are required."],
        },
        { status: 400 },
      );
    }
    const okFront = isUploadedAssetPath(nationalIdFrontImage, SUBDIR);
    const okBack = isUploadedAssetPath(nationalIdBackImage, SUBDIR);
    if (!okFront || !okBack) {
      return NextResponse.json(
        {
          error: "Image URLs must be same-origin upload paths from this platform.",
          errors: ["Image URLs must be same-origin upload paths from this platform."],
        },
        { status: 400 },
      );
    }
  }

  const dupFan = findActiveUserWithSameFaydaFan(fan, auth.user.id);
  if (dupFan) {
    return NextResponse.json(
      {
        error:
          "This FAN (Fayda Alias Number) is already linked to another account with an active verification. If this is your ID, contact support.",
      },
      { status: 409 },
    );
  }

  const updated = submitNationalIdVerification(auth.user.id, {
    nationalIdFan: fan,
    nationalIdName,
    nationalIdFrontImage,
    nationalIdBackImage,
    nationalIdCity,
    nationalIdSubcity,
    nationalIdWoreda,
    nationalIdPhoneOnId,
    nationalIdAddressLine,
  });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  notifyAdminsNewVerificationRequest(auth.user.id, "national_id");

  return NextResponse.json({
    status: updated.nationalIdStatus,
    message:
      "Your Fayda (Ethiopian Digital ID) details have been submitted for verification. You will be notified once reviewed.",
  });
}

async function saveIdImageFile(
  file: Blob,
  userId: string,
  side: "front" | "back",
): Promise<{ ok: true; publicPath: string } | { ok: false; error: string }> {
  const origName = file instanceof File && file.name ? file.name : "id.jpg";
  const ext = path.extname(origName).toLowerCase() || ".jpg";
  if (!ALLOWED.has(ext)) {
    return { ok: false, error: "Use JPG, PNG, or WebP for ID images." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const filename = `${userId}-${side}-${Date.now()}${ext}`;
  const saved = await writeBufferToUpload(SUBDIR, filename, buf);
  if (!saved.ok) {
    return { ok: false, error: saved.error };
  }
  return { ok: true, publicPath: saved.publicPath };
}
