"use client";
import { useLang } from "@/lib/lang-context";
export function StatsSection() {
  const { lang } = useLang();
  const stats = [
    { n:"2003", l:{ mn:"Үүссэн он", en:"Founded" } },
    { n:"50+",  l:{ mn:"Мэргэжлийн ажилтан", en:"Specialist Staff" } },
    { n:"250",  l:{ mn:"Зуны багтаамж", en:"Summer Capacity" } },
    { n:"380км",l:{ mn:"УБ-аас зай", en:"From Ulaanbaatar" } },
  ];
  return (
    <section className="bg-white border-b border-slate-100 py-8 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
        {stats.map((s,i) => (
          <div key={i} className="text-center py-4 px-6">
            <div className="font-serif text-3xl text-teal">{s.n}</div>
            <div className="text-[11px] text-slate-400 mt-1.5">{s.l[lang]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
