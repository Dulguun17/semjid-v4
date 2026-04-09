"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Phone, ChevronDown } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { useDynamicContent } from "@/lib/use-dynamic-content";
import { t, PHONE1 } from "@/lib/data";

export function HeroSection() {
  const { lang } = useLang();
  const { getContent } = useDynamicContent();

  // Fallback to static content if dynamic content not loaded
  const badge = getContent('hero', 'badge', lang) || t.hero.badge[lang];
  const tag1 = getContent('hero', 'tag1', lang) || t.hero.tag1[lang];
  const tag2 = getContent('hero', 'tag2', lang) || t.hero.tag2[lang];
  const tag3 = getContent('hero', 'tag3', lang) || t.hero.tag3[lang];
  const desc = getContent('hero', 'desc', lang) || t.hero.desc[lang];
  const cta1 = getContent('hero', 'cta1', lang) || t.hero.cta1[lang];
  const cta2 = getContent('hero', 'cta2', lang) || t.hero.cta2[lang];
  const phoneLabel = getContent('hero', 'phone', lang) || t.hero.phone[lang];

  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-main.png"
          alt="Сэмжид Хужирт"
          fill
          sizes="100vw"
          className="object-cover"
          priority
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-slate-800/20" />
      </div>

      {/* Logo top-right */}
      <div className="absolute top-6 right-6 z-10">
        <div className="relative w-16 h-16 opacity-90">
          <Image src="/images/logo.png" alt="Logo" fill sizes="64px" className="object-contain drop-shadow-lg" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pb-20 lg:pb-28">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="mb-5 fade-up">
            <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-white/60">
              <span className="w-8 h-px bg-teal-light inline-block" />
              {badge}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif leading-[1.05] mb-6 fade-up2">
            <span className="block text-[clamp(48px,7vw,96px)] text-white">{tag1},</span>
            <span className="block text-[clamp(48px,7vw,96px)] text-teal-light italic">{tag2},</span>
            <span className="block text-[clamp(48px,7vw,96px)] text-gold">{tag3}</span>
          </h1>

          <p className="text-[15px] text-white/65 leading-relaxed max-w-lg mb-8 fade-up3">
            {desc}
          </p>

          {/* Services Preview */}
          <div className="mb-8 fade-up3">
            <p className="text-[11px] tracking-[0.25em] uppercase text-white/60 mb-3">
              {lang === "mn" ? "ҮНДСЭН ЭМЧИЛГЭЭНҮҮД" : "SIGNATURE TREATMENTS"}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: { mn: "«Хөх Сувд» Рашаан", en: "«Blue Pearl» Springs" }, icon: "🌊" },
                { name: { mn: "«Хар Сувд» Шавар", en: "«Black Pearl» Mud" }, icon: "🏔️" },
                { name: { mn: "Монгол Бариа", en: "Mongolian Massage" }, icon: "💆" },
                { name: { mn: "Физиотерапи", en: "Physiotherapy" }, icon: "🏥" },
              ].map((service, i) => (
                <div key={i} className="inline-flex items-center gap-1.5 text-[12px] text-white/80 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
                  <span>{service.icon}</span>
                  <span>{service.name[lang]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 items-center fade-up3">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 text-[13px] font-medium bg-teal hover:bg-teal-dark text-white px-8 py-3.5 rounded-lg no-underline transition-colors shadow-lg shadow-teal/30"
            >
              {cta1} <ArrowRight size={14} />
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 text-[13px] bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3.5 rounded-lg no-underline transition-colors"
            >
              {cta2}
            </Link>
            <a
              href={`tel:${PHONE1.replace(/-/g, "")}`}
              className="inline-flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white no-underline transition-colors"
            >
              <Phone size={13} className="text-teal-light" /> {phoneLabel}: {PHONE1}
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
