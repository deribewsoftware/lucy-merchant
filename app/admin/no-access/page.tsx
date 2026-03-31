import { redirect } from "next/navigation";

/** Bookmark-friendly alias for the “no admin permissions yet” experience. */
export default function AdminNoAccessAliasPage() {
  redirect("/admin/pending-access");
}
