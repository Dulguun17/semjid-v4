"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Phone, ChevronDown } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, PHONE1 } from "@/lib/data";

export function HeroSection() {
  const { lang } = useLang();
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-main.png"
          alt="Сэмжид Хужирт"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-slate-800/20" />
      </div>

      {/* Logo top-right */}
      <div className="absolute top-6 right-6 z-10">
        <div className="relative w-16 h-16 opacity-90">
          <Image src="/images/logo.png" alt="Logo" fill className="object-contain drop-shadow-lg" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pb-20 lg:pb-28">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="mb-5 fade-up">
            <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-white/60">
              <span className="w-8 h-px bg-teal-light inline-block" />
              {t.hero.badge[lang]}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif leading-[1.05] mb-6 fade-up2">
            <span className="block text-[clamp(48px,7vw,96px)] text-white">{t.hero.tag1[lang]},</span>
            <span className="block text-[clamp(48px,7vw,96px)] text-teal-light italic">{t.hero.tag2[lang]},</span>
            <span className="block text-[clamp(48px,7vw,96px)] text-gold">{t.hero.tag3[lang]}</span>
          </h1>

          <p className="text-[15px] text-white/65 leading-relaxed max-w-lg mb-8 fade-up3">
            {t.hero.desc[lang]}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 items-center fade-up3">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 text-[13px] font-medium bg-teal hover:bg-teal-dark text-white px-8 py-3.5 rounded-lg no-underline transition-colors shadow-lg shadow-teal/30"
            >
              {t.hero.cta1[lang]} <ArrowRight size={14} />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-[13px] bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3.5 rounded-lg no-underline transition-colors"
            >
              {t.hero.cta2[lang]}
            </Link>
            <a
              href={`tel:${PHONE1.replace(/-/g, "")}`}
              className="inline-flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white no-underline transition-colors"
            >
              <Phone size={13} className="text-teal-light" /> {PHONE1}
            </a>
          </div>
        </div>
      </div>

      {/* Bottom stat bar */}
      <div className="absolute bottom-0 right-0 hidden lg:flex z-10">
        {(
          [
            ["2003", { mn: "Үүссэн он",      en: "Founded"       }],
            ["50+",  { mn: "Мэргэжилтэн",    en: "Specialists"   }],
            ["180",  { mn: "Зочны багтаамж", en: "Capacity"      }],
          ] as [string, { mn: string; en: string }][]
        ).map(([n, l], i) => (
          <div key={i} className="bg-teal/80 backdrop-blur-sm border-l border-white/10 px-6 py-4 text-center min-w-[110px]">
            <div className="font-serif text-2xl text-white">{n}</div>
            <div className="text-[10px] text-white/50 mt-0.5">{l[lang]}</div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-1 text-white/30">
        <span className="text-[9px] tracking-[0.3em] uppercase">Scroll</span>
        <ChevronDown size={14} className="animate-bounce" />
      </div>
    </section>
  );
}
