import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import { LegalSections } from "@/components/legal-doc-sections";
import { StaticDocLayout } from "@/components/static-doc-layout";
import { brandCopy } from "@/lib/brand/copy";

export const metadata: Metadata = {
  title: `Privacy policy | ${brandCopy.name}`,
  description: `How ${brandCopy.name} collects, uses, and protects personal information on the B2B marketplace.`,
};

const lastUpdated = "March 25, 2026";

const sections = [
  {
    heading: "Introduction",
    paragraphs: [
      `${brandCopy.name} (“we”, “us”, “our”) respects your privacy. This policy describes how we handle information when you use our website and marketplace services (the “Services”). By using the Services, you agree to this policy alongside our Terms of service.`,
    ],
  },
  {
    heading: "Information we collect",
    paragraphs: [
      "Account and profile data: name, email, company affiliation, role (e.g. merchant, supplier, admin), and credentials you provide when registering or updating your profile.",
      "Transaction and activity data: orders, cart actions, messages or notifications sent through the platform, and similar operational records needed to run the marketplace.",
      "Technical data: IP address, device and browser type, approximate location derived from IP, cookies or similar technologies, and logs used for security, debugging, and analytics.",
      "Content you submit: product listings, reviews, comments, support requests, and other materials you post or upload.",
    ],
  },
  {
    heading: "How we use information",
    paragraphs: [
      "We use information to provide and improve the Services: authenticate users, display catalogs, process orders, enable supplier and merchant workflows, and communicate about your account.",
      "We use technical and usage data to secure the platform, prevent fraud and abuse, monitor performance, and understand aggregate usage patterns.",
      "Where permitted by law, we may send service-related notices and, if you opt in, marketing about features or offers. You can opt out of promotional emails using the link in those messages where applicable.",
    ],
  },
  {
    heading: "Legal bases (where applicable)",
    paragraphs: [
      "If you are in a region that requires a legal basis for processing (for example the EEA or UK), we rely on performance of a contract, legitimate interests (such as security and product improvement), consent where required, and legal obligation where applicable.",
    ],
  },
  {
    heading: "Sharing and processors",
    paragraphs: [
      "We share information with service providers who assist us (e.g. hosting, email delivery, analytics) under contracts that require appropriate protection of personal data.",
      "We may disclose information if required by law, to enforce our terms, or to protect the rights, safety, or integrity of users and the public.",
      "We do not sell your personal information as a commodity. Any future “sale” or “sharing” as defined by U.S. state privacy laws would be described in an updated notice with opt-out rights where required.",
    ],
  },
  {
    heading: "Retention",
    paragraphs: [
      "We retain information for as long as your account is active and as needed to provide the Services, comply with legal obligations, resolve disputes, and enforce agreements. Retention periods may vary by data category and jurisdiction.",
    ],
  },
  {
    heading: "Security",
    paragraphs: [
      "We implement technical and organizational measures designed to protect personal information. No method of transmission or storage is completely secure; we encourage strong passwords and careful sharing of account access.",
    ],
  },
  {
    heading: "Your rights and choices",
    paragraphs: [
      "Depending on where you live, you may have rights to access, correct, delete, or export certain personal data, or to object to or restrict certain processing. You may also have the right to lodge a complaint with a supervisory authority.",
      "To exercise rights, contact us at hello@lucymerchant.com. We may need to verify your request before responding.",
    ],
  },
  {
    heading: "International transfers",
    paragraphs: [
      "If we transfer personal data across borders, we use appropriate safeguards where required by law (such as standard contractual clauses or equivalent mechanisms).",
    ],
  },
  {
    heading: "Children",
    paragraphs: [
      "The Services are not directed at children under 16 (or the minimum age in your jurisdiction). We do not knowingly collect personal information from children.",
    ],
  },
  {
    heading: "Changes",
    paragraphs: [
      "We may update this policy from time to time. We will post the revised version on this page and update the “Last updated” date. Material changes may be communicated through the Services or by email where appropriate.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Questions about this privacy policy: hello@lucymerchant.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <StaticDocLayout
      breadcrumbLabel="Privacy policy"
      eyebrow="Legal"
      title="Privacy policy"
      lead="This policy explains what we collect, why we use it, and the choices available to you when you use our marketplace."
      icon={Shield}
    >
      <p className="text-xs text-muted-foreground/90">
        Last updated: {lastUpdated}. This document is provided for transparency;
        have it reviewed by qualified counsel before relying on it in production.
      </p>
      <LegalSections sections={sections} />
      <p className="border-t border-border/50 pt-6 text-xs text-muted-foreground/90">
        See also{" "}
        <Link href="/terms" className="font-medium text-primary hover:underline">
          Terms of service
        </Link>
        .
      </p>
    </StaticDocLayout>
  );
}
