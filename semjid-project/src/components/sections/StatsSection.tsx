"use client";
import { useLang } from "@/lib/lang-context";
import { t } from "@/lib/data";

export function StatsSection() {
  const { lang } = useLang();
  const stats = [
    { n: "2003", l: { mn: "Үүсгэн байгуулагдсан", en: "Established" } },
    { n: "50+",  l: { mn: "Мэргэжлийн ажилтан", en: "Specialist Staff" } },
    { n: "180",  l: { mn: "Зуны хүчин чадал", en: "Summer Capacity" } },
    { n: "380",  l: { mn: "КМ Улаанбаатараас", en: "KM from Ulaanbaatar" } },
  ];
  return (
    <section className="bg-primary py-10 px-6 lg:px-14">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className={`text-center ${i < stats.length-1 ? "border-r border-white/10" : ""}`}>
            <div className="font-display text-4xl font-semibold text-gold">{s.n}</div>
            <div className="font-body text-[10px] tracking-[0.2em] uppercase text-white/50 mt-2">{s.l[lang]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
