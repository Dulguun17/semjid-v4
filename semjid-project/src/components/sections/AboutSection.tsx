"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t } from "@/lib/data";

export function AboutSection() {
  const { lang } = useLang();
  return (
    <section className="bg-white py-20 px-6 lg:px-14">
      <div className="max-w-7xl mx-auto">
        {/* Section header like Khan Khujirt style */}
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(26px,3.5vw,44px)] font-semibold text-primary tracking-wide uppercase mb-2">
            {t.about.title[lang]}
          </h2>
          <div className="w-12 h-0.5 bg-primary mx-auto mb-4" />
          <p className="font-body text-xs tracking-[0.3em] uppercase text-steel">
            {t.about.founded[lang]}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Image collage */}
          <div className="relative h-[440px]">
            <div className="absolute top-0 left-0 w-[62%] h-[72%] overflow-hidden shadow-lg">
              <Image src="/images/resort-exterior.jpg" alt="Semjid Khujirt" fill className="object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-[54%] h-[56%] overflow-hidden shadow-lg border-4 border-white">
              <Image src="/images/landscape.jpeg" alt="Landscape" fill className="object-cover" />
            </div>
            <div className="absolute top-[70%] left-0 w-[40%] h-[28%] bg-primary flex items-center justify-center p-4 shadow-lg">
              <div className="text-center">
                <div className="font-display text-3xl font-semibold text-gold">2003</div>
                <div className="font-body text-[9px] tracking-[0.25em] uppercase text-white/60 mt-1">
                  {lang === "mn" ? "байгуулагдсан" : "established"}
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="font-body text-[10px] tracking-[0.4em] uppercase text-primary mb-4">{t.about.eyebrow[lang]}</p>

            {/* Two pearls — signature feature */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-primary/5 border border-primary/15 p-4 text-center">
                <div className="text-2xl mb-2">💎</div>
                <div className="font-display text-sm font-semibold text-primary mb-1">{t.about.blue[lang]}</div>
                <div className="font-body text-[11px] text-steel">{t.about.blueDesc[lang]}</div>
              </div>
              <div className="bg-deep/5 border border-deep/10 p-4 text-center">
                <div className="text-2xl mb-2">🖤</div>
                <div className="font-display text-sm font-semibold text-deep mb-1">{t.about.black[lang]}</div>
                <div className="font-body text-[11px] text-steel">{t.about.blackDesc[lang]}</div>
              </div>
            </div>

            <p className="font-body font-light text-steel leading-[1.9] mb-4 text-[14px]">{t.about.body1[lang]}</p>
            <p className="font-body font-light text-steel leading-[1.9] text-[14px]">{t.about.body2[lang]}</p>

            {/* Distance info */}
            <div className="mt-6 space-y-2">
              {[t.about.dist1, t.about.dist2, t.about.dist3].map((d, i) => (
                <div key={i} className="flex items-center gap-2 font-body text-xs text-steel">
                  <MapPin size={11} className="text-primary shrink-0" />
                  {d[lang]}
                </div>
              ))}
            </div>

            <Link href="/about"
              className="mt-6 inline-flex items-center gap-2 font-body text-[11px] tracking-[0.2em] uppercase text-primary hover:text-primary-dark no-underline border-b border-primary/30 hover:border-primary pb-0.5 transition-colors cursor-none">
              {lang === "mn" ? "Дэлгэрэнгүй" : "Read More"} <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Conditions treated strip */}
        <div className="border border-primary/15 p-8 bg-cream">
          <h3 className="font-display text-xl font-semibold text-primary text-center mb-6 uppercase tracking-wide">
            {t.conditions.title[lang]}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {t.conditions.list.map((c, i) => (
              <div key={i} className="flex items-start gap-2 font-body text-xs text-steel">
                <span className="text-primary mt-0.5 shrink-0">✦</span>
                <span>{c[lang]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
