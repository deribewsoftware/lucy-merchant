"use client";

import Link from "next/link";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi2";
import { AdminCompanyVerifyActions } from "@/components/admin-company-verify-actions";
import type { Company } from "@/lib/domain/types";
import { stripHtmlToPlainText } from "@/lib/rich-text";

type Props = { companies: Company[] };

export function AdminCompanyVerify({ companies }: Props) {
  if (companies.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <HiOutlineCheckCircle className="h-8 w-8" />
        </span>
        <p className="mt-4 text-base font-medium text-base-content">
          Queue clear
        </p>
        <p className="mt-1 max-w-sm text-sm text-base-content/55">
          No suppliers are waiting for verification right now.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <ul className="space-y-4">
        {companies.map((c) => (
          <li
            key={c.id}
            className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex min-w-0 flex-1 gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HiOutlineBuildingOffice2 className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-base-content">
                    {c.name}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
                    <HiOutlineClock className="h-3.5 w-3.5" />
                    Pending
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-base-content/45">
                  Owner {c.ownerId}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-base-content/70">
                  {stripHtmlToPlainText(c.description)}
                </p>
                <Link
                  href={`/admin/companies/${c.id}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  View full details
                </Link>
              </div>
            </div>
            <AdminCompanyVerifyActions
              companyId={c.id}
              companyName={c.name}
              showVerificationActions
              className="w-full sm:w-auto sm:min-w-[12rem]"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
