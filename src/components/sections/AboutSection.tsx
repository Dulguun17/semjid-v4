"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t } from "@/lib/data";

export function AboutSection() {
  const { lang } = useLang();
  const stats: Array<[string, { mn: string; en: string }]> = [
    [t.about.s1n, t.about.s1l],
    [t.about.s2n, t.about.s2l],
    [t.about.s3n, t.about.s3l],
    [t.about.s4n, t.about.s4l],
  ];
  return (
    <section className="bg-white py-20 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 relative h-56 rounded-xl overflow-hidden">
            <Image src="/images/resort-building.jpg" alt="Resort" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="relative h-40 rounded-xl overflow-hidden">
            <Image src="/images/resort-nature.jpg" alt="Nature" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
          </div>
          <div className="relative h-40 rounded-xl overflow-hidden">
            <Image src="/images/therapy-mud.jpg" alt="Therapy" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
          </div>
        </div>
        <div>
          <span className="inline-block text-[11px] tracking-[0.2em] uppercase text-teal bg-teal/8 border border-teal/15 px-3 py-1.5 rounded mb-4">{t.about.badge[lang]}</span>
          <h2 className="font-serif text-[clamp(26px,3.5vw,44px)] text-slate-800 leading-tight mb-5">{t.about.title[lang]}</h2>
          <div className="space-y-3 text-[14.5px] text-slate-500 leading-relaxed mb-6">
            <p>{t.about.p1[lang]}</p>
            <p>{t.about.p2[lang]}</p>
            <p>{t.about.p3[lang]}</p>
            <p>{t.about.p4[lang]}</p>
          </div>
          <div className="grid grid-cols-4 gap-3 py-5 border-y border-slate-100 mb-6">
            {stats.map(([value, label], i) => (
              <div key={i} className="text-center">
                <div className="font-serif text-2xl text-teal">{value}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{label[lang]}</div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 mb-5 bg-slate-50 rounded-lg p-3">
            <CheckCircle size={15} className="text-teal mt-0.5 shrink-0" />
            <span className="text-[13.5px] text-slate-600">{t.about.p5[lang]}</span>
          </div>
          <Link href="/about" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-teal hover:text-teal-dark no-underline transition-colors">
            {t.about.more[lang]} <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
