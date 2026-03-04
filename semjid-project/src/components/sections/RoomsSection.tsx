"use client";
import Image from "next/image";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, rooms, formatMNT } from "@/lib/data";

export function RoomsSection() {
  const { lang } = useLang();
  return (
    <section className="bg-white py-20 px-6 lg:px-14">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-[clamp(24px,3.5vw,42px)] font-semibold text-primary tracking-wide uppercase mb-2">
            {t.rooms.title[lang]}
          </h2>
          <div className="w-12 h-0.5 bg-primary mx-auto mb-3" />
          <p className="font-body text-[10px] tracking-[0.3em] uppercase text-steel">{t.rooms.eyebrow[lang]}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {rooms.slice(0,3).map(room => {
            const price = room.priceBuilding2 ?? room.priceBuilding1;
            return (
              <div key={room.id} className="group border border-gray-100 hover:shadow-md transition-shadow cursor-none overflow-hidden">
                <div className="relative h-52 overflow-hidden">
                  <Image src={room.img} alt={room.name[lang]} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-primary/80 backdrop-blur-sm text-white text-[9px] tracking-widest uppercase px-3 py-1">
                    {room.type[lang]}
                  </div>
                  {price && (
                    <div className="absolute bottom-3 right-3 bg-gold text-deep font-medium text-[11px] px-3 py-1">
                      {formatMNT(price)} {t.rooms.perNight[lang]}
                    </div>
                  )}
                </div>
                <div className="p-5 bg-white">
                  <h3 className="font-display text-lg font-semibold text-deep mb-1">{room.name[lang]}</h3>
                  <div className="flex items-center gap-1.5 text-steel mb-3">
                    <Users size={11} />
                    <span className="font-body text-xs">{room.capacity} {lang === "mn" ? "хүн" : "guests"}</span>
                  </div>
                  <p className="font-body text-xs text-steel leading-relaxed mb-4 line-clamp-2">{room.desc[lang]}</p>
                  <Link href="/booking" className="font-body text-[10px] tracking-[0.2em] uppercase text-primary hover:text-primary-dark no-underline flex items-center gap-1.5 cursor-none border-b border-primary/20 hover:border-primary pb-0.5 w-fit transition-colors">
                    {t.rooms.bookBtn[lang]} <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-cream border border-primary/10 p-5 text-center mb-6">
          <p className="font-body text-xs text-steel">{t.rooms.note[lang]}</p>
        </div>

        <div className="text-center">
          <Link href="/rooms"
            className="font-body text-[11px] tracking-[0.25em] uppercase border-2 border-primary text-primary hover:bg-primary hover:text-white px-10 py-3 no-underline transition-colors cursor-none inline-block">
            {lang === "mn" ? "Бүх өрөөг харах" : "View All Rooms"} →
          </Link>
        </div>
      </div>
    </section>
  );
}
