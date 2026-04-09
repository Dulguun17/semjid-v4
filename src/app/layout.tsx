import type { Metadata } from "next";
import Script from 'next/script';
import "./globals.css";
import { LangProvider } from "@/lib/lang-context";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/ui/ChatWidget";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Сэмжид Хужирт Рашаан Сувилал",
  description: "Монголын анхны хувийн рашаан сувилал. Mongolia's first private mineral resort.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Сэмжид Хужирт Рашаан Сувилал",
    description: "Монголын анхны хувийн рашаан сувилал. Mongolia's first private mineral resort.",
    url: siteUrl,
    siteName: "Semjid Khujirt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>
        <LangProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ChatWidget />
        </LangProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </body>
    </html>
  );
}
