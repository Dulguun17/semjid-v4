"use client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, PHONE1, PHONE2, PHONE_BUS1, PHONE_BUS2 } from "@/lib/data";

export function Footer() {
  const { lang } = useLang();
  return (
    <footer className="bg-slate-900 text-slate-400 pt-12 pb-6 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-12 h-12 bg-white/10 rounded-full overflow-hidden">
              <Image src="/images/logo.png" alt="Logo" fill className="object-contain p-1"/>
            </div>
            <div>
              <div className="font-serif text-white text-[16px]">Сэмжид Хужирт</div>
              <div className="text-[9px] text-slate-500 tracking-widest">РАШААН СУВИЛАЛ</div>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed max-w-xs">{t.footer.tagline[lang]}</p>
        </div>
        <div>
          <h4 className="text-[10px] tracking-widest uppercase text-slate-500 mb-4">{t.footer.nav[lang]}</h4>
          <ul className="space-y-2.5 list-none">
            {[["/",t.nav.home],["/about",t.nav.about],["/rooms",t.nav.rooms],["/booking",t.nav.booking],["/faq", {mn:"Тусламж", en:"FAQ"}],["/privacy",t.footer.privacy],["/terms",t.footer.terms],["/refund-policy",t.footer.refund]].map(([href,label]) => (
              <li key={href as string}>
                <Link href={href as string} className="text-[13px] text-slate-500 hover:text-white no-underline transition-colors">
                  {(label as {mn:string;en:string})[lang]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] tracking-widest uppercase text-slate-500 mb-4">{t.footer.contact[lang]}</h4>
          <ul className="space-y-3 list-none">
            <li className="flex items-start gap-2"><MapPin size={13} className="text-teal mt-0.5 shrink-0"/><span className="text-[13px]">{t.footer.addr[lang]}</span></li>
            <li className="flex items-center gap-2"><Phone size={13} className="text-teal shrink-0"/>
              <div>
                <a href={`tel:${PHONE1.replace(/-/g,"")}`} className="text-[13px] text-slate-400 hover:text-white no-underline block">{PHONE1}</a>
                <a href={`tel:${PHONE2.replace(/-/g,"")}`} className="text-[13px] text-slate-400 hover:text-white no-underline block">{PHONE2}</a>
              </div>
            </li>
            <li className="text-[11px] text-slate-500">{lang==="mn"?"Билет: ":"Bus: "}{PHONE_BUS1}, {PHONE_BUS2}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">
        <p className="text-[11px] text-slate-600">© {new Date().getFullYear()} «ТӨБАСЭ ХХК» — Сэмжид Хужирт. {t.footer.rights[lang]}</p>
        <p className="text-[11px] text-slate-600">{lang==="mn"?"Жилийн 4 улиралд нээлттэй":"Open Year-Round"}</p>
      </div>
    </footer>
  );
}
