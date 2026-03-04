"use client";
import Image from "next/image";
import Link from "next/link";
import { Users, Check, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, rooms, formatMNT } from "@/lib/data";

export function RoomsPageContent() {
  const { lang } = useLang();
  return (
    <div className="pt-28 bg-white">
      <div className="ornament-bg border-b border-primary/10 py-10 px-6 lg:px-14 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="font-body text-[9px] tracking-[0.5em] uppercase text-steel mb-2">
            {lang === "mn" ? "Нүүр хуудас" : "Home"} › {t.rooms.eyebrow[lang]}
          </div>
          <h1 className="font-display text-[clamp(26px,4vw,50px)] font-semibold text-primary uppercase tracking-wide mb-2">
            {t.rooms.title[lang]}
          </h1>
          <div className="w-12 h-0.5 bg-primary mx-auto" />
        </div>
      </div>

      {/* Price table - from the official document */}
      <section className="py-10 px-6 lg:px-14 bg-cream ornament-bg">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-xl font-semibold text-primary text-center mb-6 uppercase tracking-wide">
            {lang === "mn" ? "Өрөөний үнийн жагсаалт (₮/хүн/шөнө)" : "Room Price List (₮/person/night)"}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-sm font-body text-sm">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="p-3 text-left text-[10px] tracking-widest uppercase font-medium">{lang === "mn" ? "Өрөөний ангилал" : "Room Type"}</th>
                  <th className="p-3 text-center text-[10px] tracking-widest uppercase font-medium">{lang === "mn" ? "1-р байр" : "Building 1"}</th>
                  <th className="p-3 text-center text-[10px] tracking-widest uppercase font-medium">{lang === "mn" ? "2-р байр" : "Building 2"}</th>
                  <th className="p-3 text-center text-[10px] tracking-widest uppercase font-medium">{lang === "mn" ? "Хүчин чадал" : "Capacity"}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: { mn: "Люкс", en: "Luxury Suite" }, b1: null, b2: 113000, cap: 2 },
                  { name: { mn: "2 Ортой Өрөө", en: "2-Bed Room" }, b1: 88000, b2: null, cap: 2 },
                  { name: { mn: "4 Ортой Өрөө", en: "4-Bed Room" }, b1: 88000, b2: 83000, cap: 4 },
                  { name: { mn: "5 Ортой Өрөө", en: "5-Bed Room" }, b1: 83000, b2: null, cap: 5 },
                  { name: { mn: "Зуны Байр", en: "Summer House" }, b1: 78000, b2: null, cap: 3 },
                  { name: { mn: "Цомцог Гэр", en: "Traditional Ger" }, b1: 83000, b2: null, cap: 4 },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-cream/60"}>
                    <td className="p-3 font-medium text-deep border-b border-gray-100">{row.name[lang]}</td>
                    <td className="p-3 text-center text-primary font-medium border-b border-gray-100">
                      {row.b1 ? formatMNT(row.b1) : <span className="text-steel/40">—</span>}
                    </td>
                    <td className="p-3 text-center text-primary font-medium border-b border-gray-100">
                      {row.b2 ? formatMNT(row.b2) : <span className="text-steel/40">—</span>}
                    </td>
                    <td className="p-3 text-center text-steel border-b border-gray-100">{row.cap} {lang === "mn" ? "хүн" : "pax"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-body text-xs text-steel mt-3 text-center">{t.rooms.note[lang]}</p>
        </div>
      </section>

      {/* Room cards */}
      <section className="py-14 px-6 lg:px-14">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rooms.map(room => {
            const price = room.priceBuilding2 ?? room.priceBuilding1;
            return (
              <div key={room.id} className="border border-gray-100 hover:shadow-md transition-shadow overflow-hidden cursor-none group">
                <div className="relative h-60 overflow-hidden">
                  <Image src={room.img} alt={room.name[lang]} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-sm text-white text-[9px] tracking-widest uppercase px-3 py-1">{room.type[lang]}</div>
                  {price && <div className="absolute top-4 right-4 bg-gold text-deep font-medium text-[11px] px-3 py-1">{formatMNT(price)}<span className="text-[9px]">{t.rooms.perNight[lang]}</span></div>}
                </div>
                <div className="p-6 bg-white">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-display text-xl font-semibold text-deep">{room.name[lang]}</h3>
                    <div className="flex items-center gap-1 text-steel shrink-0 mt-1">
                      <Users size={12}/><span className="font-body text-xs">{room.capacity} {lang === "mn" ? "хүн" : "guests"}</span>
                    </div>
                  </div>
                  <p className="font-body text-sm text-steel leading-relaxed mb-4">{room.desc[lang]}</p>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {room.amenities.map(a => (
                      <div key={a.en} className="flex items-center gap-1.5">
                        <Check size={11} className="text-primary shrink-0" />
                        <span className="font-body text-xs text-steel">{a[lang]}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/booking"
                    className="font-body text-[10px] tracking-[0.25em] uppercase bg-primary hover:bg-primary-dark text-white px-6 py-3 no-underline transition-colors cursor-none inline-flex items-center gap-2">
                    {t.rooms.bookBtn[lang]} <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
