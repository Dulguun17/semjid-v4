import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/lang-context";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/ui/ChatWidget";

export const metadata: Metadata = {
  title: "Сэмжид Хужирт Рашаан Сувилал",
  description: "Монголын анхны хувийн рашаан сувилал. Mongolia's first private mineral resort.",
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
      </body>
    </html>
  );
}
