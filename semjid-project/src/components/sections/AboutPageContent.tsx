"use client";
import Image from "next/image";
import { MapPin, Users, Calendar, Car } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t } from "@/lib/data";

export function AboutPageContent() {
  const { lang } = useLang();
  return (
    <div className="pt-28 bg-white">
      {/* Page header - Khan Khujirt style with ornamental bg */}
      <div className="ornament-bg border-b border-primary/10 py-10 px-6 lg:px-14 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="font-body text-[9px] tracking-[0.5em] uppercase text-steel mb-2">
            {lang === "mn" ? "Нүүр хуудас" : "Home Page"} › {t.about.eyebrow[lang]}
          </div>
          <h1 className="font-display text-[clamp(28px,4vw,52px)] font-semibold text-primary uppercase tracking-wide mb-2">
            {t.about.eyebrow[lang]}
          </h1>
          <div className="w-12 h-0.5 bg-primary mx-auto" />
        </div>
      </div>

      {/* Main about content */}
      <section className="py-16 px-6 lg:px-14">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="relative h-[450px] shadow-lg overflow-hidden">
            <Image src="/images/resort-exterior.jpg" alt="Semjid Khujirt" fill className="object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/80 to-transparent p-6">
              <div className="font-display text-white text-xl font-semibold">{t.about.title[lang]}</div>
              <div className="font-body text-white/70 text-xs mt-1">{t.about.founded[lang]}</div>
            </div>
          </div>

          <div>
            <h2 className="font-display text-[clamp(24px,3vw,42px)] font-semibold text-primary uppercase tracking-wide mb-6">
              {t.about.title[lang]}
            </h2>
            <p className="font-body text-sm text-steel leading-[2] mb-5">{t.about.body1[lang]}</p>
            <p className="font-body text-sm text-steel leading-[2] mb-6">{t.about.body2[lang]}</p>

            {/* Quick facts */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Calendar, text: t.about.yearRound[lang] },
                { icon: Users, text: t.about.capacity[lang] },
                { icon: Users, text: t.about.staff[lang] },
                { icon: Car, text: t.about.road[lang] },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-steel">
                  <Icon size={13} className="text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Two pearls */}
      <section className="bg-cream ornament-bg py-16 px-6 lg:px-14">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-[clamp(22px,3vw,38px)] font-semibold text-primary uppercase tracking-wide mb-2">
              {lang === "mn" ? "Манай гол онцлог" : "Our Signature Features"}
            </h2>
            <div className="w-12 h-0.5 bg-primary mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-primary/15 p-8 text-center shadow-sm">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="font-display text-2xl font-semibold text-primary mb-3">{t.about.blue[lang]}</h3>
              <div className="w-8 h-0.5 bg-primary mx-auto mb-4" />
              <p className="font-body text-sm text-steel leading-relaxed">{t.about.blueDesc[lang]}</p>
            </div>
            <div className="bg-white border border-deep/10 p-8 text-center shadow-sm">
              <div className="text-4xl mb-4">🖤</div>
              <h3 className="font-display text-2xl font-semibold text-deep mb-3">{t.about.black[lang]}</h3>
              <div className="w-8 h-0.5 bg-deep/30 mx-auto mb-4" />
              <p className="font-body text-sm text-steel leading-relaxed">{t.about.blackDesc[lang]}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section className="bg-white py-16 px-6 lg:px-14">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-[clamp(22px,3vw,38px)] font-semibold text-primary uppercase tracking-wide mb-2">
              {t.conditions.title[lang]}
            </h2>
            <div className="w-12 h-0.5 bg-primary mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {t.conditions.list.map((c, i) => (
              <div key={i} className="flex items-start gap-3 bg-cream border border-primary/10 p-4">
                <span className="text-primary font-bold text-sm shrink-0">✦</span>
                <span className="font-body text-sm text-steel">{c[lang]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="bg-primary py-16 px-6 lg:px-14">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-[clamp(22px,3vw,38px)] font-semibold text-white uppercase tracking-wide mb-6">
              {lang === "mn" ? "Байршил & Зам" : "Location & Distance"}
            </h2>
            <div className="space-y-4">
              {[
                { label: t.about.dist1[lang], sub: lang === "mn" ? "Хатуу хучилттай засмал зам" : "Via paved road" },
                { label: t.about.dist2[lang], sub: lang === "mn" ? "Аймгийн төвөөс" : "From provincial capital" },
                { label: t.about.dist3[lang], sub: lang === "mn" ? "Орхоны хөндийн түүхт газруудаас" : "From Orkhon Valley historic sites" },
              ].map((d, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-white/10 pb-4">
                  <MapPin size={14} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <div className="font-body text-sm text-white font-medium">{d.label}</div>
                    <div className="font-body text-xs text-white/50">{d.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-72 overflow-hidden shadow-lg">
            <Image src="/images/landscape.jpeg" alt="Location" fill className="object-cover" />
          </div>
        </div>
      </section>
    </div>
  );
}
