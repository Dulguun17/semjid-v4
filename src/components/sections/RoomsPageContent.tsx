"use client";
import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, Check, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, formatMNT } from "@/lib/data";
import { getDynamicRooms } from "@/lib/dynamic-data";
import type { RoomItem } from "@/lib/data";
import { ReviewsSection } from "@/components/ui/ReviewsSection";

export function RoomsPageContent() {
  const { lang } = useLang();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getDynamicRooms()
      .then(setRooms)
      .catch(error => {
        console.error("Failed to load room catalogue", error);
        setLoadError("Өрөөний мэдээллийг одоогоор ачаалж чадсангүй.");
      });
  }, []);

  const filteredRooms = useMemo(() => {
    let filtered = rooms;

    if (searchTerm) {
      filtered = filtered.filter(room =>
        room.name[lang].toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.desc[lang].toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priceFilter) {
      const maxPrice = parseInt(priceFilter);
      filtered = filtered.filter(room => {
        const price = room.adult1 ?? room.adult2 ?? null;
        return price !== null && price <= maxPrice;
      });
    }

    if (capacityFilter) {
      const minCapacity = parseInt(capacityFilter);
      filtered = filtered.filter(room => room.capacity >= minCapacity);
    }

    return filtered;
  }, [rooms, searchTerm, priceFilter, capacityFilter, lang]);

  return (
    <div className="bg-slate-50">
      <div className="relative h-64 overflow-hidden">
        <Image src="/images/image3.jpeg" alt="Өрөөнүүд" fill className="object-cover"/>
        <div className="absolute inset-0 bg-teal-dark/75"/>
        <div className="absolute inset-0 flex items-center px-6 lg:px-10">
          <div className="max-w-7xl w-full mx-auto">
            <p className="text-[11px] tracking-[0.25em] uppercase text-teal-light mb-2">{t.rooms.badge[lang]}</p>
            <h1 className="font-serif text-[clamp(28px,5vw,60px)] text-white">{t.rooms.title[lang]}</h1>
            <p className="text-[14px] text-white/55 mt-2 max-w-xl">{t.rooms.sub[lang]}</p>
          </div>
        </div>
      </div>

      {/* Pricing table */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="bg-teal px-6 py-3">
            <p className="text-[12px] text-white font-medium">{t.rooms.note[lang]}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left p-3 text-slate-600">{lang==="mn"?"Ангилал":"Type"}</th>
                  <th className="p-3 text-slate-600 text-center">{lang==="mn"?"Нас. 1-р":"Adult B1"}</th>
                  <th className="p-3 text-slate-600 text-center">{lang==="mn"?"Нас. 2-р":"Adult B2"}</th>
                  <th className="p-3 text-slate-600 text-center">{lang==="mn"?"Хүүхэд 0-2":"Child 0-2"}</th>
                  <th className="p-3 text-slate-600 text-center">{lang==="mn"?"Хүүхэд 3-7\n1-р":"Child 3-7 B1"}</th>
                  <th className="p-3 text-slate-600 text-center">{lang==="mn"?"Хүүхэд 3-7\n2-р":"Child 3-7 B2"}</th>
                  <th className="p-3 text-slate-600 text-center">{lang==="mn"?"Хүүхэд 8-12\n1-р":"Child 8-12 B1"}</th>
                  <th className="p-3 text-slate-600 text-center">{lang==="mn"?"Хүүхэд 8-12\n2-р":"Child 8-12 B2"}</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r,i) => (
                  <tr key={r.id} className={i%2===0?"bg-white":"bg-slate-50/50"}>
                    <td className="p-3 font-medium text-slate-700">{r.name[lang]}</td>
                    {[r.adult1,r.adult2,r.child02,r.child37a,r.child37b,r.child812a,r.child812b].map((v,j) => (
                      <td key={j} className="p-3 text-center text-slate-600">{v ? formatMNT(v) : <span className="text-slate-200">—</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <section className="pb-14 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">{lang === "mn" ? "Өрөө хайх, шүүх" : "Search & filter rooms"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="room-search" className="block text-sm font-medium mb-1">{lang === "mn" ? "Өрөө хайх" : "Search rooms"}</label>
                <input
                  id="room-search" type="text"
                  placeholder={lang === "mn" ? "Өрөөний нэр" : "Room name"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label htmlFor="room-price" className="block text-sm font-medium mb-1">{lang === "mn" ? "1 насанд хүрэгчийн шөнийн дээд үнэ (₮)" : "Max adult nightly rate (₮)"}</label>
                <input
                  id="room-price" type="number" min="0"
                  placeholder={lang === "mn" ? "Жишээ нь 100000" : "e.g. 100000"}
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label htmlFor="room-capacity" className="block text-sm font-medium mb-1">{lang === "mn" ? "Хамгийн бага багтаамж" : "Minimum capacity"}</label>
                <input
                  id="room-capacity" type="number" min="1"
                  placeholder={lang === "mn" ? "Жишээ нь 2" : "e.g. 2"}
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {loadError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{lang === "mn" ? loadError : "Room information could not be loaded right now."}</p>}
          {filteredRooms.map(r => {
            const price = r.adult1 ?? r.adult2 ?? null;
            return (
              <div key={r.id} className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg hover:border-teal/20 transition-all group">
                <div className="relative h-52 overflow-hidden">
                  <Image src={r.img} alt={r.name[lang]} fill className="object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute top-3 left-3 bg-teal text-white text-[10px] px-2.5 py-1 rounded-full">{r.type[lang]}</div>
                  <div className="absolute top-3 right-3 bg-gold text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">{price === null ? (lang === "mn" ? "Үнэ тодруулах" : "Ask for rate") : formatMNT(price)}<span className="block">{lang === "mn" ? "1 насанд хүрэгч / шөнө" : "per adult / night"}</span></div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="font-serif text-[19px] text-slate-800">{r.name[lang]}</h3>
                    <div className="flex items-center gap-1 text-slate-400 shrink-0 mt-1"><Users size={13}/><span className="text-[12px]">{r.capacity} {t.rooms.guests[lang]}</span></div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{r.desc[lang]}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {r.amenities.map(a => (
                      <div key={a.en} className="flex items-center gap-2"><Check size={12} className="text-teal shrink-0"/><span className="text-sm text-slate-600">{a[lang]}</span></div>
                    ))}
                  </div>
                  <p className="mb-4 text-sm leading-6 text-slate-600">{lang === "mn" ? "Байрлах хугацаа, нийт үнийг огноо сонгож шалгана. Хоол, багцад багтах зүйлийг хүлээн авалтаас тодруулна. Эмчилгээ нь эмчийн зөвлөгөөнөөс хамаарна." : "Choose dates to review stay length and total. Confirm meals and package inclusions with reception. Treatments depend on a clinical consultation."}</p>
                  <Link href="/booking" className="inline-flex items-center gap-2 text-[12px] font-medium text-white bg-teal hover:bg-teal-dark px-5 py-2.5 rounded-lg no-underline transition-colors">
                    {lang === "mn" ? "Огноо, нийт үнэ шалгах" : "Check dates & total"} <ArrowRight size={12}/>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-14 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <ReviewsSection />
        </div>
      </section>
    </div>
  );
}
