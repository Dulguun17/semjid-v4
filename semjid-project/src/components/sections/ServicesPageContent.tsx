"use client";
import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, services, formatMNT } from "@/lib/data";

export function ServicesPageContent() {
  const { lang } = useLang();
  return (
    <div className="pt-28 bg-white">
      <div className="ornament-bg border-b border-primary/10 py-10 px-6 lg:px-14 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="font-body text-[9px] tracking-[0.5em] uppercase text-steel mb-2">
            {lang === "mn" ? "Нүүр хуудас" : "Home"} › {t.services.eyebrow[lang]}
          </div>
          <h1 className="font-display text-[clamp(26px,4vw,50px)] font-semibold text-primary uppercase tracking-wide mb-2">
            {t.services.title[lang]}
          </h1>
          <div className="w-12 h-0.5 bg-primary mx-auto" />
        </div>
      </div>

      <section className="py-14 px-6 lg:px-14">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map(svc => (
            <div key={svc.id} className="bg-white border border-gray-100 hover:shadow-md transition-shadow overflow-hidden cursor-none group">
              <div className="relative h-52 overflow-hidden">
                <Image src={svc.img} alt={svc.name[lang]} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                {svc.badge && (
                  <span className="absolute top-3 left-3 bg-primary text-white text-[9px] tracking-widest uppercase px-3 py-1">{svc.badge[lang]}</span>
                )}
              </div>
              <div className="p-6">
                <p className="font-body text-[9px] tracking-[0.3em] uppercase text-primary/60 mb-1">{svc.category[lang]}</p>
                <h3 className="font-display text-xl font-semibold text-deep mb-2">{svc.name[lang]}</h3>
                <p className="font-body text-sm text-steel leading-relaxed mb-5">{svc.desc[lang]}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-steel">
                    <Clock size={12} />
                    <span className="font-body text-xs">{svc.duration}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-base font-semibold text-primary">{formatMNT(svc.price)}<span className="text-xs text-steel font-normal">/хүн</span></span>
                    <Link href="/booking" className="w-8 h-8 bg-primary/10 hover:bg-primary flex items-center justify-center text-primary hover:text-white transition-colors no-underline cursor-none">
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
