import type { Metadata } from "next";
import Link from "next/link";
import { Scale } from "lucide-react";
import { LegalSections } from "@/components/legal-doc-sections";
import { StaticDocLayout } from "@/components/static-doc-layout";
import { brandCopy } from "@/lib/brand/copy";

export const metadata: Metadata = {
  title: `Terms of service | ${brandCopy.name}`,
  description: `Terms governing use of ${brandCopy.name} marketplace, accounts, listings, and orders.`,
};

const lastUpdated = "March 25, 2026";

const sections = [
  {
    heading: "Agreement",
    paragraphs: [
      `These Terms of service (“Terms”) govern your access to and use of ${brandCopy.name}’s website and marketplace (the “Services”). By creating an account, accessing, or using the Services, you agree to these Terms and our Privacy policy.`,
    ],
  },
  {
    heading: "Eligibility and accounts",
    paragraphs: [
      "You must have the legal capacity and authority to enter into these Terms on behalf of yourself or your organization. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.",
      "You agree to provide accurate registration information and to keep it current. We may suspend or terminate accounts that violate these Terms or present security or legal risk.",
    ],
  },
  {
    heading: "Roles",
    paragraphs: [
      "The Services support distinct roles (such as merchant, supplier, and administrator). Features available to you depend on your role. You may not misrepresent your role or access areas not intended for you.",
    ],
  },
  {
    heading: "Marketplace nature",
    paragraphs: [
      `${brandCopy.name} provides a platform for discovery, communication, and order workflows. Unless we explicitly state otherwise, we are not a party to contracts between merchants and suppliers. You are responsible for evaluating counterparties, listings, and commercial terms.`,
      "Listings, prices, availability, and minimum order quantities are supplied by suppliers or the platform configuration. We do not guarantee uninterrupted or error-free operation of the Services.",
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: [
      "You may not use the Services to violate law, infringe intellectual property, distribute malware, harass users, scrape or overload systems without permission, circumvent security, or engage in fraudulent or deceptive conduct.",
      "We may remove content, restrict features, or terminate access when we reasonably believe a violation has occurred.",
    ],
  },
  {
    heading: "Content and intellectual property",
    paragraphs: [
      "You retain ownership of content you submit, subject to a license to us to host, display, and use that content as needed to operate and improve the Services.",
      "The Services, branding, and our proprietary materials are owned by us or our licensors and are protected by intellectual property laws. No rights are granted except as expressly stated in these Terms.",
    ],
  },
  {
    heading: "Disclaimers",
    paragraphs: [
      'THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE” TO THE MAXIMUM EXTENT PERMITTED BY LAW. WE DISCLAIM IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT WHERE DISCLAIMERS ARE ALLOWED.',
    ],
  },
  {
    heading: "Limitation of liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR AFFILIATES, OFFICERS, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM OR RELATED TO THE SERVICES OR THESE TERMS.",
      "OUR AGGREGATE LIABILITY FOR CLAIMS ARISING OUT OF OR RELATED TO THE SERVICES OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICES IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS (USD $100), EXCEPT WHERE LIABILITY CANNOT BE LIMITED BY LAW.",
    ],
  },
  {
    heading: "Indemnity",
    paragraphs: [
      "You will defend and indemnify us and our affiliates against claims, damages, losses, and expenses (including reasonable attorneys’ fees) arising from your use of the Services, your content, or your violation of these Terms, except to the extent caused by our willful misconduct.",
    ],
  },
  {
    heading: "Governing law and disputes",
    paragraphs: [
      "These Terms are governed by the laws of the State of California, USA, excluding conflict-of-law rules, unless a different governing law is required by mandatory local law. Courts in San Francisco County, California shall have exclusive jurisdiction for disputes, subject to any non-waivable rights you may have in your country of residence.",
    ],
  },
  {
    heading: "Changes",
    paragraphs: [
      "We may modify these Terms by posting an updated version on this page. Continued use after the effective date constitutes acceptance of the revised Terms where permitted by law. If you do not agree, you must stop using the Services.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Questions about these Terms: hello@lucymerchant.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <StaticDocLayout
      breadcrumbLabel="Terms of service"
      eyebrow="Legal"
      title="Terms of service"
      lead="Please read these terms carefully. They set out the rules for using our marketplace and related services."
      icon={Scale}
    >
      <p className="text-xs text-muted-foreground/90">
        Last updated: {lastUpdated}. This document is a starting point for a
        production deployment; obtain legal review for your jurisdiction and
        business model.
      </p>
      <LegalSections sections={sections} />
      <p className="border-t border-border/50 pt-6 text-xs text-muted-foreground/90">
        See also{" "}
        <Link
          href="/privacy"
          className="font-medium text-primary hover:underline"
        >
          Privacy policy
        </Link>
        .
      </p>
    </StaticDocLayout>
  );
}
