"use client";
import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, services, formatMNT } from "@/lib/data";

export function ServicesSection() {
  const { lang } = useLang();
  return (
    <section className="bg-slate-50 py-20 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-teal block mb-1">{t.services.badge[lang]}</span>
            <h2 className="font-serif text-[clamp(26px,3vw,40px)] text-slate-800">{t.services.title[lang]}</h2>
          </div>
          <Link href="/services" className="text-[13px] text-teal hover:text-teal-dark no-underline flex items-center gap-1">{t.services.viewAll[lang]}</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.slice(0,6).map(s => (
            <div key={s.id} className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg hover:border-teal/20 transition-all group">
              <div className="relative h-48 overflow-hidden">
                <Image src={s.img} alt={s.name[lang]} fill className="object-cover group-hover:scale-105 transition-transform duration-500"/>
                {s.badge && <span className="absolute top-3 left-3 bg-teal text-white text-[10px] tracking-wider px-2.5 py-1 rounded-full">{s.badge[lang]}</span>}
              </div>
              <div className="p-5">
                <span className="text-[10px] tracking-[0.2em] uppercase text-teal">{s.cat[lang]}</span>
                <h3 className="font-serif text-[17px] text-slate-800 mt-1.5 mb-2 leading-snug">{s.name[lang]}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2 mb-4">{s.desc[lang]}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400"><Clock size={12}/><span className="text-[12px]">{s.duration}</span></div>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-bold text-teal">{formatMNT(s.price)}</span>
                    <Link href="/booking" className="w-8 h-8 rounded-full bg-teal/8 hover:bg-teal flex items-center justify-center text-teal hover:text-white transition-colors no-underline">
                      <ArrowRight size={13}/>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
