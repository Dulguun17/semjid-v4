import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";
import { LangProvider } from "@/lib/lang-context";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/ui/ChatWidget";
import { MobileBookingCTA } from "@/components/ui/MobileBookingCTA";
import { canonicalSiteOrigin, publicIndexingEnabled } from "@/lib/site-metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CookieConsentProvider } from "@/components/privacy/CookieConsent";

const siteUrl = canonicalSiteOrigin() || "http://localhost:3000";
const gaMeasurementId = process.env.GA_ANALYTICS_APPROVED === "true"
  ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID : undefined;

export const metadata: Metadata = {
  title: "Сэмжид Хужирт Рашаан Сувилал",
  description: "Монголын анхны хувийн рашаан сувилал. Mongolia's first private mineral resort.",
  metadataBase: new URL(siteUrl),
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  robots: publicIndexingEnabled() ? undefined : { index: false, follow: false },
  openGraph: { type: "website", siteName: "Semjid Khujirt", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Semjid Khujirt" }] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} /></head>
      <body>
        <LangProvider>
          <CookieConsentProvider measurementId={gaMeasurementId}>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:p-3 focus:text-slate-900">Үндсэн хэсэг / Skip to content</a>
          <Navbar />
          <div id="main-content" tabIndex={-1}><Breadcrumbs />{children}</div>
          <Footer />
          <MobileBookingCTA />
          <ChatWidget />
          </CookieConsentProvider>
        </LangProvider>
      </body>
    </html>
  );
}
