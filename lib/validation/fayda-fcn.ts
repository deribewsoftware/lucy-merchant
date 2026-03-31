/** Fayda verification — FAN (Fayda Alias Number) is 16 digits (non-digits stripped). */

export const FAYDA_FAN_DIGITS = 16;

export const FAYDA_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const FAYDA_ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

const MAX_MAIN_TEXT = 200;
const MAX_OPTIONAL_TEXT = 500;

export function normalizeFaydaDigits(input: string): string {
  return input.replace(/\D/g, "");
}

export function validateFaydaFan(input: string):
  | { ok: true; fan: string }
  | { ok: false; error: string } {
  const fan = normalizeFaydaDigits(input);
  if (!fan) {
    return {
      ok: false,
      error:
        "FAN: enter your 16-digit Fayda Alias Number (spaces or dashes are ignored).",
    };
  }
  if (fan.length !== FAYDA_FAN_DIGITS) {
    return {
      ok: false,
      error: `FAN: must be exactly ${FAYDA_FAN_DIGITS} digits after removing spaces/dashes (you entered ${fan.length}).`,
    };
  }
  return { ok: true, fan };
}

/** Display FAN in four groups: XXXX-XXXX-XXXX-XXXX */
export function formatFanDisplay(digits: string | undefined): string {
  if (!digits || digits.length !== FAYDA_FAN_DIGITS) return digits ?? "—";
  return [
    digits.slice(0, 4),
    digits.slice(4, 8),
    digits.slice(8, 12),
    digits.slice(12, 16),
  ].join("-");
}

export type FaydaVerificationTextInput = {
  nationalIdFan: string;
  nationalIdName: string;
  nationalIdCity: string;
  nationalIdSubcity?: string;
  nationalIdWoreda?: string;
  nationalIdPhoneOnId?: string;
  nationalIdAddressLine?: string;
};

/**
 * Text rules: name, city, optional lengths, and FAN (16 digits).
 */
export function validateFaydaVerificationText(
  input: FaydaVerificationTextInput,
): { ok: true; fan: string } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  const name = input.nationalIdName.trim();
  if (!name) {
    errors.push("Full name is required (exactly as on your Digital ID).");
  } else if (name.length < 2) {
    errors.push("Full name must be at least 2 characters.");
  } else if (name.length > MAX_MAIN_TEXT) {
    errors.push(`Full name must be at most ${MAX_MAIN_TEXT} characters.`);
  }

  const city = input.nationalIdCity.trim();
  if (!city) {
    errors.push("City is required.");
  } else if (city.length < 2) {
    errors.push("City must be at least 2 characters.");
  } else if (city.length > MAX_MAIN_TEXT) {
    errors.push(`City must be at most ${MAX_MAIN_TEXT} characters.`);
  }

  function checkOpt(raw: string | undefined, label: string): void {
    const t = (raw ?? "").trim();
    if (t.length > MAX_OPTIONAL_TEXT) {
      errors.push(`${label} must be at most ${MAX_OPTIONAL_TEXT} characters.`);
    }
  }
  checkOpt(input.nationalIdSubcity, "Subcity");
  checkOpt(input.nationalIdWoreda, "Woreda");
  checkOpt(input.nationalIdPhoneOnId, "Phone on ID");
  checkOpt(input.nationalIdAddressLine, "Extra address line");

  let fanDigits = "";
  const fanRes = validateFaydaFan(input.nationalIdFan);
  if (!fanRes.ok) errors.push(fanRes.error);
  else fanDigits = fanRes.fan;

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, fan: fanDigits };
}

function extensionFromFilename(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0) return "";
  return name.slice(i).toLowerCase();
}

const ALLOWED_EXT_SET = new Set<string>(FAYDA_ALLOWED_IMAGE_EXTENSIONS);

/** Client-side check before upload; mirrors server rules. */
export function validateFaydaIdImageFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size > FAYDA_MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    const maxMb = FAYDA_MAX_IMAGE_BYTES / (1024 * 1024);
    return {
      ok: false,
      error: `Image size must be ${maxMb}MB or less (this file is ${mb}MB).`,
    };
  }
  const ext = extensionFromFilename(file.name) || ".jpg";
  if (!ALLOWED_EXT_SET.has(ext)) {
    return {
      ok: false,
      error: `Use JPG, PNG, or WebP for ID images (got “${ext || "unknown"}”).`,
    };
  }
  return { ok: true };
}
