"use client";
import Link from "next/link";
import { Phone } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, PHONE1, PHONE2 } from "@/lib/data";

export function BookingCTA() {
  const { lang } = useLang();
  return (
    <section className="bg-primary py-16 px-6 lg:px-14">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="font-display text-[clamp(26px,4vw,52px)] font-semibold text-white mb-3">
          {lang === "mn" ? "Захиалга өгч эмчилгээгээ эхлүүлэ" : "Book Now & Begin Your Healing"}
        </h2>
        <p className="font-body text-white/60 mb-8 text-base">
          {lang === "mn" ? "Жилийн 4 улирал тасралтгүй ажилладаг. Урьдчилан захиалга хийнэ үү." : "Open year-round. Advance booking recommended."}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/booking"
            className="font-body text-[11px] tracking-[0.25em] uppercase bg-gold hover:bg-gold-light text-deep font-medium px-10 py-4 no-underline transition-colors cursor-none">
            {t.nav.booking[lang]}
          </Link>
          <a href={`tel:+976${PHONE1.replace(/-/g,"")}`}
            className="font-body text-[11px] tracking-[0.25em] uppercase border border-white/30 hover:border-gold text-white hover:text-gold px-10 py-4 no-underline transition-colors cursor-none flex items-center gap-2">
            <Phone size={13} /> {PHONE1}
          </a>
          <a href={`tel:+976${PHONE2.replace(/-/g,"")}`}
            className="font-body text-[11px] tracking-[0.25em] uppercase border border-white/30 hover:border-gold text-white hover:text-gold px-10 py-4 no-underline transition-colors cursor-none flex items-center gap-2">
            <Phone size={13} /> {PHONE2}
          </a>
        </div>
      </div>
    </section>
  );
}
