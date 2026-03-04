"use client";
import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, services, formatMNT } from "@/lib/data";

export function ServicesSection() {
  const { lang } = useLang();
  return (
    <section className="bg-cream py-20 px-6 lg:px-14 ornament-bg">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-[clamp(24px,3.5vw,42px)] font-semibold text-primary tracking-wide uppercase mb-2">
            {t.services.title[lang]}
          </h2>
          <div className="w-12 h-0.5 bg-primary mx-auto mb-3" />
          <p className="font-body text-[10px] tracking-[0.3em] uppercase text-steel">{t.services.eyebrow[lang]}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {services.slice(0,3).map(svc => (
            <div key={svc.id} className="bg-white group cursor-none hover:shadow-md transition-shadow border border-gray-100">
              <div className="relative h-48 overflow-hidden">
                <Image src={svc.img} alt={svc.name[lang]} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                {svc.badge && (
                  <span className="absolute top-3 left-3 bg-primary text-white text-[9px] tracking-widest uppercase px-3 py-1">
                    {svc.badge[lang]}
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="font-body text-[9px] tracking-[0.3em] uppercase text-primary/60 mb-1">{svc.category[lang]}</p>
                <h3 className="font-display text-lg font-semibold text-deep mb-2">{svc.name[lang]}</h3>
                <p className="font-body text-xs text-steel leading-relaxed mb-4 line-clamp-3">{svc.desc[lang]}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-steel">
                    <Clock size={11} />
                    <span className="font-body text-xs">{svc.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm text-primary font-medium">{formatMNT(svc.price)}{lang === "mn" ? "/хүн" : "/pp"}</span>
                    <Link href="/booking" className="w-7 h-7 bg-primary/10 hover:bg-primary flex items-center justify-center text-primary hover:text-white transition-colors no-underline cursor-none">
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/services"
            className="font-body text-[11px] tracking-[0.25em] uppercase border-2 border-primary text-primary hover:bg-primary hover:text-white px-10 py-3 no-underline transition-colors cursor-none inline-block">
            {lang === "mn" ? "Бүх эмчилгээг харах" : "View All Treatments"} →
          </Link>
        </div>
      </div>
    </section>
  );
}
