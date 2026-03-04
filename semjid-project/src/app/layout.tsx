import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/lang-context";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Сэмжид Хүжирт Рашаан Сувилал",
  description: "Монголын анхны хувийн рашаан сувилал. Mongolia's first private mineral resort.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LangProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
