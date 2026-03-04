"use client";
import { CheckCircle2 } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, conditions } from "@/lib/data";

export function ConditionsSection() {
  const { lang } = useLang();
  return (
    <section className="bg-teal py-16 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="font-sans text-[11px] tracking-[0.2em] uppercase text-teal-light block mb-2">{t.conditions.eyebrow[lang]}</span>
          <h2 className="font-serif text-[clamp(24px,3vw,38px)] text-white mb-2">{t.conditions.title[lang]}</h2>
          <p className="font-sans text-[14px] text-white/60 italic">{t.conditions.sub[lang]}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {conditions.map((c, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-white/8 hover:bg-white/12 rounded-lg px-4 py-3 transition-colors">
              <CheckCircle2 size={15} className="text-teal-light mt-0.5 shrink-0" />
              <span className="font-sans text-[13px] text-white/80">{c[lang]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
