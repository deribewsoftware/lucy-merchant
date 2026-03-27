"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
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
  HiOutlineFingerPrint,
} from "react-icons/hi2";

type VerificationData = {
  nationalIdStatus?: string;
  nationalIdNumber?: string;
  nationalIdName?: string;
  nationalIdFrontImage?: string;
  nationalIdBackImage?: string;
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

export default function MerchantVerificationPage() {
  const router = useRouter();
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [nationalIdName, setNationalIdName] = useState("");
  const [frontImage, setFrontImage] = useState("");
  const [backImage, setBackImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const res = await fetch("/api/auth/verify-identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nationalIdNumber: nationalIdNumber.trim(),
        nationalIdName: nationalIdName.trim(),
        nationalIdFrontImage: frontImage.trim(),
        nationalIdBackImage: backImage.trim(),
      }),
    });

    const result = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(result.error ?? "Submission failed");
      return;
    }

    setSuccess(result.message ?? "Submitted successfully!");
    router.refresh();
    // Reload data
    setTimeout(() => {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => setData(d.user ?? d));
    }, 500);
  }

  const status = data?.nationalIdStatus ?? "none";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm text-base-content/50">Loading verification status…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-primary/[0.04] to-accent/[0.06] p-6 shadow-sm ring-1 ring-base-300/20 sm:p-8"
      >
        <div className="absolute inset-0 lm-grid-pattern opacity-40" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <HiOutlineFingerPrint className="h-7 w-7" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                Identity Verification
              </h1>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-base-content/65">
                Verify your identity with your National ID to unlock full platform access.
                This helps us ensure a safe and trustworthy marketplace.
              </p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </motion.header>

      {/* Status Card */}
      {status === "pending" && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="relative overflow-hidden rounded-2xl border-2 border-warning/30 bg-gradient-to-br from-warning/5 via-base-100 to-warning/[0.03] p-6 shadow-md sm:p-8"
        >
          <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-warning/10 blur-2xl" />
          <div className="relative flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning">
              <HiOutlineClock className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-base-content">Verification Under Review</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-base-content/65">
                Your National ID has been submitted and is being reviewed by our verification team.
                This usually takes <strong className="text-base-content/80">1-2 business days</strong>.
                You&apos;ll receive a notification once verified.
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
        </motion.div>
      )}

      {status === "approved" && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="relative overflow-hidden rounded-2xl border-2 border-success/30 bg-gradient-to-br from-success/5 via-base-100 to-success/[0.03] p-6 shadow-md sm:p-8"
        >
          <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-success/10 blur-3xl" />
          <div className="relative flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success/15 text-success">
              <HiOutlineShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-success">Identity Verified</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-base-content/65">
                Your National ID has been verified. You have full access to all platform features.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-base-300/50 bg-base-100/80 px-4 py-3">
                  <p className="text-xs text-base-content/45">ID Number</p>
                  <p className="mt-0.5 font-mono text-sm font-medium text-base-content">
                    {data?.nationalIdNumber ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-base-300/50 bg-base-100/80 px-4 py-3">
                  <p className="text-xs text-base-content/45">Full Name</p>
                  <p className="mt-0.5 text-sm font-medium text-base-content">
                    {data?.nationalIdName ?? "—"}
                  </p>
                </div>
              </div>
              {data?.nationalIdReviewedAt && (
                <p className="mt-3 text-xs text-base-content/40">
                  Verified on {new Date(data.nationalIdReviewedAt).toLocaleString()}
                </p>
              )}
            </div>
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
              <h2 className="text-lg font-bold text-error">Verification Declined</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-base-content/65">
                Your previous submission was not approved. Please review the reason below and re-submit.
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

      {/* Submission Form — shown when none or rejected */}
      {(status === "none" || status === "rejected") && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <form
            onSubmit={onSubmit}
            className="relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm ring-1 ring-base-300/20 sm:p-8"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HiOutlineIdentification className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-base-content">
                  {status === "rejected" ? "Re-submit Your National ID" : "Submit Your National ID"}
                </h2>
                <p className="text-xs text-base-content/55">All fields are required</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {/* ID Number */}
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  <HiOutlineFingerPrint className="h-3.5 w-3.5" />
                  National ID Number
                </span>
                <input
                  required
                  type="text"
                  placeholder="e.g. 0000-0000-0000"
                  value={nationalIdNumber}
                  onChange={(e) => setNationalIdNumber(e.target.value)}
                  className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm font-mono text-base-content shadow-sm outline-none transition placeholder:text-base-content/35 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              {/* Full Name */}
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  <HiOutlineUser className="h-3.5 w-3.5" />
                  Full Name (as on ID)
                </span>
                <input
                  required
                  type="text"
                  placeholder="Enter your full legal name"
                  value={nationalIdName}
                  onChange={(e) => setNationalIdName(e.target.value)}
                  className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/35 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              {/* Front Image */}
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  <HiOutlinePhoto className="h-3.5 w-3.5" />
                  ID Front Image URL
                </span>
                <input
                  required
                  type="url"
                  placeholder="https://… front photo"
                  value={frontImage}
                  onChange={(e) => setFrontImage(e.target.value)}
                  className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/35 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              {/* Back Image */}
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  <HiOutlinePhoto className="h-3.5 w-3.5" />
                  ID Back Image URL
                </span>
                <input
                  required
                  type="url"
                  placeholder="https://… back photo"
                  value={backImage}
                  onChange={(e) => setBackImage(e.target.value)}
                  className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/35 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            {/* Info Banner */}
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-info/20 bg-info/5 px-4 py-3">
              <HiOutlineExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0 text-info" />
              <p className="text-xs leading-relaxed text-base-content/65">
                Ensure the image URLs are clear, readable photos of both sides of your National ID.
                Reviews are processed within <strong>1-2 business days</strong> (Mon–Fri, 9 AM – 5 PM EAT).
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error"
              >
                <HiOutlineXCircle className="h-4 w-4 shrink-0" />
                {error}
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-content shadow-md shadow-primary/20 transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-content border-t-transparent" />
                    Submitting…
                  </>
                ) : status === "rejected" ? (
                  <>
                    <HiOutlineArrowPath className="h-4 w-4" />
                    Re-submit for Verification
                  </>
                ) : (
                  <>
                    <HiOutlineShieldCheck className="h-4 w-4" />
                    Submit for Verification
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Process Steps */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={3}
        className="rounded-2xl border border-base-300 bg-base-100 p-6 ring-1 ring-base-300/15 sm:p-8"
      >
        <h3 className="text-base font-bold text-base-content">How It Works</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Submit",
              desc: "Enter your National ID details and upload clear photos of both sides.",
              color: "primary",
            },
            {
              step: "2",
              title: "Review",
              desc: "Our team reviews your submission within 1-2 business days (Mon–Fri).",
              color: "warning",
            },
            {
              step: "3",
              title: "Verified",
              desc: "Once approved, you'll see a verified badge and gain full platform access.",
              color: "success",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="group relative overflow-hidden rounded-xl border border-base-300/60 bg-gradient-to-br from-base-100 to-base-200/30 p-5 transition hover:border-primary/20 hover:shadow-md"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${s.color}/10 text-sm font-bold text-${s.color}`}
              >
                {s.step}
              </span>
              <p className="mt-3 font-semibold text-base-content">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-base-content/55">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3.5 py-1.5 text-xs font-semibold text-success ring-1 ring-success/20">
        <HiOutlineCheckCircle className="h-4 w-4" />
        Verified
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3.5 py-1.5 text-xs font-semibold text-warning ring-1 ring-warning/20">
        <HiOutlineClock className="h-4 w-4" />
        Under Review
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-error/15 px-3.5 py-1.5 text-xs font-semibold text-error ring-1 ring-error/20">
        <HiOutlineXCircle className="h-4 w-4" />
        Declined
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-base-200/60 px-3.5 py-1.5 text-xs font-semibold text-base-content/50 ring-1 ring-base-300/30">
      <HiOutlineIdentification className="h-4 w-4" />
      Not Verified
    </span>
  );
}
