"use client";
import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, services, formatMNT } from "@/lib/data";

export function ServicesPageContent() {
  const { lang } = useLang();
  return (
    <div className="bg-slate-50">
      <div className="relative h-64 overflow-hidden">
        <Image src="/images/therapy-mud.jpg" alt="Эмчилгээ" fill className="object-cover"/>
        <div className="absolute inset-0 bg-teal-dark/75"/>
        <div className="absolute inset-0 flex items-center px-6 lg:px-10">
          <div className="max-w-7xl w-full mx-auto">
            <p className="text-[11px] tracking-[0.25em] uppercase text-teal-light mb-2">{t.services.badge[lang]}</p>
            <h1 className="font-serif text-[clamp(28px,5vw,60px)] text-white">{t.services.title[lang]}</h1>
          </div>
        </div>
      </div>
      <section className="py-14 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map(s => (
            <div key={s.id} className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg hover:border-teal/20 transition-all group">
              <div className="relative h-52 overflow-hidden">
                <Image src={s.img} alt={s.name[lang]} fill className="object-cover group-hover:scale-105 transition-transform duration-500"/>
                {s.badge && <span className="absolute top-3 left-3 bg-teal text-white text-[10px] px-2.5 py-1 rounded-full">{s.badge[lang]}</span>}
              </div>
              <div className="p-5">
                <span className="text-[10px] tracking-[0.2em] uppercase text-teal">{s.cat[lang]}</span>
                <h3 className="font-serif text-[17px] text-slate-800 mt-1.5 mb-2">{s.name[lang]}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed mb-4">{s.desc[lang]}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400"><Clock size={12}/><span className="text-[12px]">{s.duration}</span></div>
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-bold text-teal">{formatMNT(s.price)}</span>
                    <Link href="/booking" className="w-8 h-8 rounded-full bg-teal/8 hover:bg-teal flex items-center justify-center text-teal hover:text-white transition-colors no-underline"><ArrowRight size={13}/></Link>
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
