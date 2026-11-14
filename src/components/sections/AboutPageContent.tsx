"use client";
import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/lib/lang-context";
import { t, conditions, PHONE_BUS1, PHONE_BUS2 } from "@/lib/data";

export function AboutPageContent() {
  const { lang } = useLang();
  const stats: Array<[string, { mn: string; en: string }]> = [
    [t.about.s1n, t.about.s1l],
    [t.about.s2n, t.about.s2l],
    [t.about.s3n, t.about.s3l],
    [t.about.s4n, t.about.s4l],
  ];
  return (
    <main className="bg-white">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image src="/images/resort-building.jpg" alt="Resort" fill className="object-cover"/>
        <div className="absolute inset-0 bg-teal-dark/75"/>
        <div className="absolute inset-0 flex items-center px-6 lg:px-10">
          <div className="max-w-7xl w-full mx-auto">
            <p className="text-[11px] tracking-[0.25em] uppercase text-teal-light mb-2">{t.about.badge[lang]}</p>
            <h1 className="font-serif text-[clamp(28px,5vw,60px)] text-white">{t.about.title[lang]}</h1>
          </div>
        </div>
      </div>
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <div className="space-y-4 text-[14.5px] text-slate-500 leading-relaxed">
            <p>{t.about.p1[lang]}</p><p>{t.about.p2[lang]}</p><p>{t.about.p3[lang]}</p><p>{t.about.p4[lang]}</p><p>{t.about.p5[lang]}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map(([value, label], i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-5 text-center border border-slate-100">
                <div className="font-serif text-3xl text-teal">{value}</div>
                <div className="text-[11px] text-slate-400 mt-1.5">{label[lang]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 px-6 lg:px-10 bg-teal">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] tracking-[0.2em] uppercase text-teal-light mb-2">{t.conditions.badge[lang]}</p>
            <h2 className="font-serif text-[clamp(22px,3vw,36px)] text-white mb-2">{t.conditions.title[lang]}</h2>
            <p className="text-[14px] text-white/55 italic">{t.conditions.note[lang]}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {conditions.map((c,i) => (
              <div key={i} className="flex items-start gap-2.5 bg-white/8 hover:bg-white/12 rounded-lg px-4 py-3 transition-colors">
                <span className="text-teal-light">✓</span>
                <span className="text-[13px] text-white/80">{c[lang]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 px-6 lg:px-10 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-teal mb-2">{t.location.badge[lang]}</p>
            <h2 className="font-serif text-[clamp(24px,3vw,38px)] text-slate-800 mb-4">{t.location.title[lang]}</h2>
            <div className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-slate-700">
              <p>{t.location.addr[lang]}</p>
              <Link href="/contact" className="inline-block min-h-11 py-3 font-semibold text-teal underline">{lang === "mn" ? "Газрын зураг, чиглэл ба хүлээн авалт" : "Map, directions and reception"}</Link>
            </div>
            <div className="bg-teal/8 border border-teal/15 rounded-xl p-5 text-[13px] text-slate-600">
              <p className="font-medium text-slate-700 mb-1">{t.location.busTitle[lang]}</p>
              <p className="leading-relaxed">{t.location.bus[lang]}</p>
              <p className="mt-2 text-teal">{t.location.ticket[lang]} {PHONE_BUS1}, {PHONE_BUS2}</p>
            </div>
          </div>
          <div className="relative h-80 rounded-2xl overflow-hidden">
            <Image src="/images/resort-main.jpg" alt="Resort" fill className="object-cover"/>
          </div>
        </div>
      </section>
    </main>
  );
}
