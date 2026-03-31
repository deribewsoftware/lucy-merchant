"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  FAYDA_FAN_DIGITS,
  FAYDA_MAX_IMAGE_BYTES,
  formatFanDisplay,
  validateFaydaIdImageFile,
  validateFaydaVerificationText,
} from "@/lib/validation/fayda-fcn";
import { PaginatedClientList } from "@/components/paginated-client-list";
import {
  HiOutlineShieldCheck,
  HiOutlineIdentification,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlinePhoto,
  HiOutlineUser,
  HiOutlineQrCode,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineTrash,
} from "react-icons/hi2";

const ID_GOV_ET = "https://id.gov.et/";

type VerificationData = {
  nationalIdStatus?: string;
  nationalIdFan?: string;
  nationalIdName?: string;
  nationalIdFrontImage?: string;
  nationalIdBackImage?: string;
  nationalIdCity?: string;
  nationalIdSubcity?: string;
  nationalIdWoreda?: string;
  nationalIdPhoneOnId?: string;
  nationalIdAddressLine?: string;
  nationalIdSubmittedAt?: string;
  nationalIdRejectionReason?: string;
  nationalIdReviewedAt?: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export type FaydaVerificationRole = "merchant" | "supplier";

export function FaydaIdVerification({ role }: { role: FaydaVerificationRole }) {
  const router = useRouter();
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);

  const [nationalIdFan, setNationalIdFan] = useState("");
  const [nationalIdName, setNationalIdName] = useState("");
  const [nationalIdCity, setNationalIdCity] = useState("");
  const [nationalIdSubcity, setNationalIdSubcity] = useState("");
  const [nationalIdWoreda, setNationalIdWoreda] = useState("");
  const [nationalIdPhoneOnId, setNationalIdPhoneOnId] = useState("");
  const [nationalIdAddressLine, setNationalIdAddressLine] = useState("");

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setData(d.user ?? d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!frontFile) {
      setFrontPreview(null);
      return;
    }
    const u = URL.createObjectURL(frontFile);
    setFrontPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [frontFile]);

  useEffect(() => {
    if (!backFile) {
      setBackPreview(null);
      return;
    }
    const u = URL.createObjectURL(backFile);
    setBackPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [backFile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);
    setSuccess(null);

    const textRes = validateFaydaVerificationText({
      nationalIdFan,
      nationalIdName,
      nationalIdCity,
      nationalIdSubcity,
      nationalIdWoreda,
      nationalIdPhoneOnId,
      nationalIdAddressLine,
    });
    if (!textRes.ok) {
      setValidationErrors(textRes.errors);
      return;
    }
    const normalizedFan = textRes.fan;

    if (!frontFile || !backFile) {
      setValidationErrors(["Upload both the front and back of your Digital ID (JPG, PNG, or WebP)."]);
      return;
    }

    const frontCheck = validateFaydaIdImageFile(frontFile);
    if (!frontCheck.ok) {
      setValidationErrors([`Front image: ${frontCheck.error}`]);
      return;
    }
    const backCheck = validateFaydaIdImageFile(backFile);
    if (!backCheck.ok) {
      setValidationErrors([`Back image: ${backCheck.error}`]);
      return;
    }

    setSubmitting(true);

    const fd = new FormData();
    fd.append("nationalIdFan", normalizedFan);
    fd.append("nationalIdName", nationalIdName.trim());
    fd.append("nationalIdCity", nationalIdCity.trim());
    if (nationalIdSubcity.trim()) fd.append("nationalIdSubcity", nationalIdSubcity.trim());
    if (nationalIdWoreda.trim()) fd.append("nationalIdWoreda", nationalIdWoreda.trim());
    if (nationalIdPhoneOnId.trim()) fd.append("nationalIdPhoneOnId", nationalIdPhoneOnId.trim());
    if (nationalIdAddressLine.trim()) fd.append("nationalIdAddressLine", nationalIdAddressLine.trim());
    fd.append("frontImage", frontFile);
    fd.append("backImage", backFile);

    const res = await fetch("/api/auth/verify-identity", {
      method: "POST",
      body: fd,
    });

    const result = (await res.json().catch(() => ({}))) as {
      error?: string;
      errors?: string[];
      message?: string;
    };
    setSubmitting(false);

    if (!res.ok) {
      const list = Array.isArray(result.errors) && result.errors.length > 0 ? result.errors : [];
      if (list.length > 0) {
        setValidationErrors(list);
      } else {
        setError(result.error ?? "Submission failed");
      }
      return;
    }

    setSuccess(result.message ?? "Submitted successfully!");
    setValidationErrors([]);
    setFrontFile(null);
    setBackFile(null);
    router.refresh();
    setTimeout(() => {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => setData(d.user ?? d));
    }, 500);
  }

  const status = data?.nationalIdStatus ?? "none";

  const roleLead =
    role === "merchant"
      ? "Confirm your identity with your Ethiopian Digital ID (Fayda) so we can trust orders and payouts on the marketplace."
      : "Confirm your identity with Fayda before company verification (TIN and Trade License). Both are required to list products.";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm text-base-content/50">Loading Fayda verification status…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="relative overflow-hidden rounded-2xl border border-emerald-200/40 bg-gradient-to-br from-emerald-50/80 via-base-100 to-amber-50/40 p-6 shadow-sm ring-1 ring-emerald-900/5 dark:border-emerald-900/30 dark:from-emerald-950/40 dark:via-base-100 dark:to-base-200/40 sm:p-8"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -12deg,
              transparent,
              transparent 12px,
              rgba(16, 185, 129, 0.06) 12px,
              rgba(16, 185, 129, 0.06) 13px
            )`,
          }}
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-400 to-red-600/90 opacity-90" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400">
              <HiOutlineIdentification className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800/80 dark:text-emerald-400/90">
                Ethiopian Digital ID · Fayda
              </p>
              <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                Identity verification
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-base-content/70">{roleLead}</p>
              <a
                href={ID_GOV_ET}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
              >
                About Fayda and National ID
                <HiOutlineArrowTopRightOnSquare className="h-4 w-4 shrink-0 opacity-80" />
              </a>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </motion.header>

      {status === "pending" && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="relative overflow-hidden rounded-2xl border-2 border-warning/30 bg-gradient-to-br from-warning/5 via-base-100 to-warning/[0.03] p-6 shadow-md sm:p-8"
        >
          <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-warning/10 blur-2xl" />
          <div className="relative space-y-6">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                <HiOutlineClock className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-base-content">Under review</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-base-content/65">
                  Your Fayda submission is being checked. This usually takes{" "}
                  <strong className="text-base-content/80">1–2 business days</strong>. You will be notified when
                  the decision is ready.
                </p>
                {data?.nationalIdSubmittedAt && (
                  <p className="mt-3 text-xs text-base-content/45">
                    Submitted {new Date(data.nationalIdSubmittedAt).toLocaleString()}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-warning" />
                  </span>
                  <span className="text-xs font-medium text-warning">Pending review</span>
                </div>
              </div>
            </div>
            <SubmittedDetails data={data} />
            <IdPhotoPair frontSrc={data?.nationalIdFrontImage} backSrc={data?.nationalIdBackImage} />
          </div>
        </motion.div>
      )}

      {status === "approved" && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-base-100 to-emerald-600/[0.03] p-6 shadow-md sm:p-8"
        >
          <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative space-y-6">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <HiOutlineShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Fayda verified</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-base-content/65">
                  {role === "merchant"
                    ? "Your identity matches your Digital ID record. You have full access to marketplace features that require verification."
                    : "Your identity matches your Digital ID record. Complete company registration with TIN and Trade License to sell."}
                </p>
                {data?.nationalIdReviewedAt && (
                  <p className="mt-3 text-xs text-base-content/40">
                    Verified on {new Date(data.nationalIdReviewedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <SubmittedDetails data={data} />
            <IdPhotoPair frontSrc={data?.nationalIdFrontImage} backSrc={data?.nationalIdBackImage} />
          </div>
        </motion.div>
      )}

      {status === "rejected" && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="relative overflow-hidden rounded-2xl border-2 border-error/30 bg-gradient-to-br from-error/5 via-base-100 to-error/[0.03] p-6 shadow-md sm:p-8"
        >
          <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-error/10 blur-2xl" />
          <div className="relative flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-error/15 text-error">
              <HiOutlineXCircle className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-error">Not approved</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-base-content/65">
                Your last submission did not pass review. Read the note below, update your Fayda details or
                photos, and submit again.
              </p>
              <div className="mt-3 rounded-xl border border-error/20 bg-error/5 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-error/70">Reason</p>
                <p className="mt-1 text-sm text-base-content/80">
                  {data?.nationalIdRejectionReason ?? "No reason provided"}
                </p>
              </div>
              {data?.nationalIdReviewedAt && (
                <p className="mt-3 text-xs text-base-content/40">
                  Reviewed on {new Date(data.nationalIdReviewedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {(status === "none" || status === "rejected") && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
          <form
            onSubmit={onSubmit}
            className="relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm ring-1 ring-base-300/20 sm:p-8"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700/90" />

            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                <HiOutlineIdentification className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-base-content">
                  {status === "rejected" ? "Submit again" : "Submit your Digital ID"}
                </h2>
                <p className="text-xs text-base-content/55">
                  Upload photos, your {FAYDA_FAN_DIGITS}-digit FAN, address, and name as on the card
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-emerald-200/50 bg-emerald-50/40 p-4 text-sm leading-relaxed text-base-content/75 dark:border-emerald-900/40 dark:bg-emerald-950/25">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200/90">What you need</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs sm:text-sm">
                <li>
                  <strong>FAN</strong> (Fayda Alias Number) — exactly {FAYDA_FAN_DIGITS} digits (often grouped on the
                  card). Each FAN can only be used once on this platform.
                </li>
                <li>
                  <strong>Photos</strong> — JPG/PNG/WebP, max {FAYDA_MAX_IMAGE_BYTES / (1024 * 1024)}MB each, full
                  card visible and readable.
                </li>
                <li>
                  <strong>Address</strong> — city is required; subcity, woreda, and phone match your card if
                  possible.
                </li>
              </ul>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  <HiOutlineQrCode className="h-3.5 w-3.5" />
                  FAN — Fayda Alias Number ({FAYDA_FAN_DIGITS} digits)
                </span>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="16 digits, e.g. grouped as XXXX-XXXX-XXXX-XXXX"
                  value={nationalIdFan}
                  onChange={(e) => setNationalIdFan(e.target.value)}
                  className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm font-mono tracking-wide text-base-content shadow-sm outline-none transition placeholder:text-base-content/35 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[11px] leading-snug text-base-content/45">
                  Enter all {FAYDA_FAN_DIGITS} digits; spaces or dashes are ignored. Must match the FAN on your card.
                </p>
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  <HiOutlineUser className="h-3.5 w-3.5" />
                  Full name (as on card)
                </span>
                <input
                  required
                  type="text"
                  placeholder="First, Middle, Surname"
                  value={nationalIdName}
                  onChange={(e) => setNationalIdName(e.target.value)}
                  className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/35 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[11px] leading-snug text-base-content/45">
                  2–200 characters, matching your ID.
                </p>
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  <HiOutlineMapPin className="h-3.5 w-3.5" />
                  City <span className="font-normal normal-case text-error">*</span>
                </span>
                <input
                  required
                  type="text"
                  placeholder="e.g. Addis Ababa"
                  value={nationalIdCity}
                  onChange={(e) => setNationalIdCity(e.target.value)}
                  className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/35 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[11px] leading-snug text-base-content/45">
                  2–200 characters (current address or as on ID).
                </p>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Subcity
                </span>
                <input
                  type="text"
                  placeholder="Optional"
                  value={nationalIdSubcity}
                  onChange={(e) => setNationalIdSubcity(e.target.value)}
                  className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/35 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Woreda
                </span>
                <input
                  type="text"
                  placeholder="e.g. 03/05"
                  value={nationalIdWoreda}
                  onChange={(e) => setNationalIdWoreda(e.target.value)}
                  className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/35 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  <HiOutlinePhone className="h-3.5 w-3.5" />
                  Phone on ID
                </span>
                <input
                  type="text"
                  placeholder="+251 …"
                  value={nationalIdPhoneOnId}
                  onChange={(e) => setNationalIdPhoneOnId(e.target.value)}
                  className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/35 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Street / kebele / extra (optional)
                </span>
                <input
                  type="text"
                  placeholder="Optional additional address line"
                  value={nationalIdAddressLine}
                  onChange={(e) => setNationalIdAddressLine(e.target.value)}
                  className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/35 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>
            </div>

            <div className="mt-8 rounded-2xl border border-emerald-200/40 bg-gradient-to-br from-emerald-50/50 to-base-100 p-4 dark:border-emerald-900/30 dark:from-emerald-950/25 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 border-b border-emerald-200/30 pb-4 dark:border-emerald-900/30 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/90 dark:text-emerald-400/90">
                    Digital ID photos
                  </p>
                  <p className="mt-1 text-sm text-base-content/70">
                    Both sides are required — well-lit, in focus, full card visible.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-emerald-600/10 px-3 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                  2 files · front &amp; back
                </span>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <IdUploadSlot
                  label="Front of card"
                  hint="Portrait and printed details visible"
                  preview={frontPreview}
                  fileName={frontFile?.name ?? null}
                  onFile={(f) => setFrontFile(f)}
                />
                <IdUploadSlot
                  label="Back of card"
                  hint="QR code and FAN visible"
                  preview={backPreview}
                  fileName={backFile?.name ?? null}
                  onFile={(f) => setBackFile(f)}
                />
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-info/20 bg-info/5 px-4 py-3">
              <HiOutlineExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0 text-info" />
              <p className="text-xs leading-relaxed text-base-content/65">
                Avoid glare and cropping. The FAN on the back must match what you typed. FAN is checked for
                duplicate use across accounts. Reviews run on{" "}
                <strong className="text-base-content/80">business days</strong> (Mon–Fri, EAT).
              </p>
            </div>

            {validationErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error"
                role="alert"
              >
                <p className="flex items-center gap-2 font-semibold">
                  <HiOutlineXCircle className="h-4 w-4 shrink-0" />
                  Fix the following before submitting:
                </p>
                <PaginatedClientList
                  items={validationErrors}
                  pageSize={6}
                  resetKey={validationErrors.join("\n")}
                  summaryClassName="mt-2 text-xs text-error/85"
                  summarySuffix="issues"
                  barClassName="mt-2"
                >
                  {(pageItems) => (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs sm:text-sm">
                      {pageItems.map((msg, idx) => (
                        <li
                          key={`${idx}-${msg.slice(0, 64)}`}
                          className="leading-relaxed"
                        >
                          {msg}
                        </li>
                      ))}
                    </ul>
                  )}
                </PaginatedClientList>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-start gap-2 rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error"
                role="alert"
              >
                <HiOutlineXCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success"
              >
                <HiOutlineCheckCircle className="h-4 w-4 shrink-0" />
                {success}
              </motion.div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting…
                  </>
                ) : status === "rejected" ? (
                  <>
                    <HiOutlineArrowPath className="h-4 w-4" />
                    Re-submit for verification
                  </>
                ) : (
                  <>
                    <HiOutlineShieldCheck className="h-4 w-4" />
                    Submit for verification
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={3}
        className="rounded-2xl border border-base-300 bg-base-100 p-6 ring-1 ring-base-300/15 sm:p-8"
      >
        <h3 className="text-base font-bold text-base-content">How it works</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <StepCard
            step="1"
            title="Upload and details"
            desc={`Enter your ${FAYDA_FAN_DIGITS}-digit FAN (Fayda Alias Number), address, name, and sharp photos of both sides of your Digital ID.`}
            accent="emerald"
          />
          <StepCard
            step="2"
            title="We review"
            desc="We verify your FAN is unique on this platform and matches your images, usually within 1–2 business days."
            accent="warning"
          />
          <StepCard
            step="3"
            title={role === "merchant" ? "Full access" : "Next: company docs"}
            desc={
              role === "merchant"
                ? "When approved, your account is treated as identity-verified across the platform."
                : "When approved, add your company with TIN and Trade License for business verification."
            }
            accent="success"
          />
        </div>
      </motion.div>
    </div>
  );
}

function SubmittedDetails({ data }: { data: VerificationData | null }) {
  if (!data) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-base-300/50 bg-base-100/80 px-4 py-3">
        <p className="text-xs text-base-content/45">FAN (Fayda Alias Number)</p>
        <p className="mt-0.5 font-mono text-sm font-medium tracking-wide text-base-content">
          {formatFanDisplay(data.nationalIdFan)}
        </p>
      </div>
      <div className="rounded-xl border border-base-300/50 bg-base-100/80 px-4 py-3">
        <p className="text-xs text-base-content/45">Name on card</p>
        <p className="mt-0.5 text-sm font-medium text-base-content">{data.nationalIdName ?? "—"}</p>
      </div>
      <div className="rounded-xl border border-base-300/50 bg-base-100/80 px-4 py-3 sm:col-span-2 lg:col-span-3">
        <p className="text-xs text-base-content/45">Address on file</p>
        <p className="mt-1 text-sm leading-relaxed text-base-content">
          {[data.nationalIdCity, data.nationalIdSubcity, data.nationalIdWoreda].filter(Boolean).join(" · ") ||
            "—"}
          {data.nationalIdAddressLine ? (
            <>
              <br />
              <span className="text-base-content/80">{data.nationalIdAddressLine}</span>
            </>
          ) : null}
        </p>
        {data.nationalIdPhoneOnId && (
          <p className="mt-2 text-xs text-base-content/55">
            <span className="font-medium text-base-content/65">Phone on ID:</span> {data.nationalIdPhoneOnId}
          </p>
        )}
      </div>
    </div>
  );
}

function IdPhotoPair({ frontSrc, backSrc }: { frontSrc?: string; backSrc?: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <IdDisplayCard label="Front" src={frontSrc} />
      <IdDisplayCard label="Back (QR & FAN)" src={backSrc} />
    </div>
  );
}

function IdDisplayCard({ label, src }: { label: string; src?: string }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-base-300/80 bg-gradient-to-b from-base-200/40 to-base-100 shadow-md ring-1 ring-base-300/35">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-300/50 bg-base-200/50 px-3 py-2.5 sm:px-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-base-content/60">{label}</span>
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600/15 dark:text-emerald-400"
          >
            Open full size
            <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <div className="relative flex min-h-[200px] items-center justify-center bg-gradient-to-b from-base-300/25 to-base-300/10 p-3 sm:min-h-[260px] sm:p-4">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic upload paths
          <img
            src={src}
            alt={label}
            className="max-h-[min(440px,72vh)] w-full rounded-xl object-contain shadow-lg ring-1 ring-black/5"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-base-200/80 text-base-content/40">
              <HiOutlinePhoto className="h-6 w-6" />
            </span>
            <p className="text-sm text-base-content/45">No image on file</p>
          </div>
        )}
      </div>
    </div>
  );
}

function IdUploadSlot({
  label,
  hint,
  preview,
  fileName,
  onFile,
}: {
  label: string;
  hint: string;
  preview: string | null;
  fileName: string | null;
  onFile: (f: File | null) => void;
}) {
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-base-content/70">{label}</span>
          <p className="mt-0.5 text-[11px] leading-snug text-base-content/50">{hint}</p>
        </div>
        {preview && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFile(null);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-base-300/80 bg-base-100 px-2.5 py-1 text-[11px] font-semibold text-base-content/50 transition hover:border-error/40 hover:bg-error/5 hover:text-error"
          >
            <HiOutlineTrash className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>
      <label
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`group relative flex min-h-[220px] cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-dashed transition sm:min-h-[240px] ${
          drag
            ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
            : "border-emerald-600/30 bg-emerald-50/40 hover:border-emerald-500/50 hover:bg-emerald-50/70 dark:border-emerald-500/35 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/45"
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onFile(f);
            e.target.value = "";
          }}
        />
        {preview ? (
          <div className="relative flex flex-1 flex-col">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              className="max-h-[min(340px,50vh)] w-full flex-1 object-contain p-3 sm:max-h-[360px]"
            />
            {fileName && (
              <div className="border-t border-base-300/40 bg-base-100/80 px-3 py-2 text-center backdrop-blur-sm">
                <p className="truncate text-[11px] font-medium text-base-content/65" title={fileName}>
                  {fileName}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center sm:p-8">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/12 text-emerald-700 dark:text-emerald-400">
              <HiOutlinePhoto className="h-7 w-7" />
            </span>
            <div>
              <p className="text-sm font-semibold text-base-content">Tap to choose or drop a file here</p>
              <p className="mt-1 text-xs text-base-content/45">
                JPG, PNG, or WebP · max {FAYDA_MAX_IMAGE_BYTES / (1024 * 1024)}MB
              </p>
            </div>
          </div>
        )}
      </label>
    </div>
  );
}

function StepCard({
  step,
  title,
  desc,
  accent,
}: {
  step: string;
  title: string;
  desc: string;
  accent: "emerald" | "warning" | "success";
}) {
  const ring =
    accent === "emerald"
      ? "ring-emerald-500/15 hover:border-emerald-500/25"
      : accent === "warning"
        ? "ring-warning/15 hover:border-warning/25"
        : "ring-success/15 hover:border-success/25";
  const badge =
    accent === "emerald"
      ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
      : accent === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-success/15 text-success";

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-base-300/60 bg-gradient-to-br from-base-100 to-base-200/30 p-5 transition hover:shadow-md ${ring}`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${badge}`}>
        {step}
      </span>
      <p className="mt-3 font-semibold text-base-content">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-base-content/55">{desc}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
        <HiOutlineCheckCircle className="h-4 w-4" />
        Fayda verified
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3.5 py-1.5 text-xs font-semibold text-warning ring-1 ring-warning/20">
        <HiOutlineClock className="h-4 w-4" />
        Under review
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-error/15 px-3.5 py-1.5 text-xs font-semibold text-error ring-1 ring-error/20">
        <HiOutlineXCircle className="h-4 w-4" />
        Not approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-base-200/60 px-3.5 py-1.5 text-xs font-semibold text-base-content/50 ring-1 ring-base-300/30">
      <HiOutlineIdentification className="h-4 w-4" />
      Not verified
    </span>
  );
}
