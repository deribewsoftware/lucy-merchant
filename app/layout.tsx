import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import Script from "next/script";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeInit } from "@/components/theme-init";
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
  title: "Lucy Merchant — B2B marketplace built for trust",
  description:
    "Verified suppliers, bulk ordering, real-time order chat, and role-secure workflows for merchants, suppliers, and admins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Script
          id="lm-theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="lm-theme",t=localStorage.getItem(k);if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
        <ThemeInit />
        <SiteHeader />
        <div className="lm-page-gradient flex min-h-dvh flex-1 flex-col bg-base-200">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
