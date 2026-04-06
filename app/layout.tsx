import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { getPublicAppUrl } from "@/lib/app-url";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { PresenceProvider } from "@/components/presence-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SupportBot } from "@/components/support-bot";
import { ThemeInit } from "@/components/theme-init";
import { decodeThemeCookieValue, THEME_COOKIE_NAME } from "@/lib/theme/theme-cookie";
import { normalizeThemeId } from "@/lib/theme/theme-id";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicAppUrl()),
  title: "Lucy Merchant | B2B Wholesale Marketplace",
  description:
    "The modern B2B marketplace connecting verified suppliers with merchants. Bulk ordering, real-time communication, and secure transactions.",
  keywords: ["B2B", "wholesale", "marketplace", "bulk ordering", "suppliers", "merchants"],
  authors: [{ name: "Lucy Merchant" }],
  openGraph: {
    title: "Lucy Merchant | B2B Wholesale Marketplace",
    description: "The modern B2B marketplace connecting verified suppliers with merchants.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  /** Enables env(safe-area-inset-*) on iOS / edge-to-edge so horizontal padding is correct in production */
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = normalizeThemeId(
    decodeThemeCookieValue(cookieStore.get(THEME_COOKIE_NAME)?.value),
  );

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh min-w-0 flex-col antialiased">
        <ThemeInit />
        <PresenceProvider>
          <SiteHeader />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
          <SiteFooter />
          <SupportBot />
        </PresenceProvider>
      </body>
    </html>
  );
}
