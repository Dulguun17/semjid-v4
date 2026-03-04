"use client";
import Image from "next/image";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, rooms, formatMNT } from "@/lib/data";

export function RoomsSection() {
  const { lang } = useLang();
  return (
    <section className="bg-white py-20 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-teal block mb-1">{t.rooms.badge[lang]}</span>
            <h2 className="font-serif text-[clamp(26px,3vw,40px)] text-slate-800">{t.rooms.title[lang]}</h2>
            <p className="text-[14px] text-slate-400 mt-1 max-w-xl">{t.rooms.sub[lang]}</p>
          </div>
          <Link href="/rooms" className="text-[13px] text-teal hover:text-teal-dark no-underline flex items-center gap-1 shrink-0">{t.rooms.viewAll[lang]}</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.slice(0,3).map(r => {
            const price = r.adult2 ?? r.adult1 ?? 0;
            return (
              <div key={r.id} className="rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg hover:border-teal/20 transition-all group">
                <div className="relative h-52 overflow-hidden">
                  <Image src={r.img} alt={r.name[lang]} fill className="object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute top-3 left-3 bg-teal text-white text-[10px] px-2.5 py-1 rounded-full">{r.type[lang]}</div>
                  <div className="absolute top-3 right-3 bg-gold text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">{formatMNT(price)}{t.rooms.night[lang]}</div>
                </div>
                <div className="p-5 bg-white">
                  <h3 className="font-serif text-[18px] text-slate-800 mb-1.5">{r.name[lang]}</h3>
                  <p className="text-[13px] text-slate-400 mb-4 line-clamp-2">{r.desc[lang]}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400"><Users size={13}/><span className="text-[12px]">{r.capacity} {t.rooms.guests[lang]}</span></div>
                    <Link href="/booking" className="text-[12px] font-medium text-teal no-underline flex items-center gap-1">{t.rooms.book[lang]} <ArrowRight size={12}/></Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
