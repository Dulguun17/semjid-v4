"use client";
import Link from "next/link";
import Image from "next/image";
import { Facebook, MapPin, Phone } from "lucide-react";
import { useCookiePreferences } from "@/components/privacy/CookieConsent";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { t, PHONE1, PHONE2, PHONE_BUS1, PHONE_BUS2, FACEBOOK_URL } from "@/lib/data";

export function Footer() {
  const { lang } = useLang();
  const { openPreferences } = useCookiePreferences();
  const path = usePathname();
  if (path.startsWith("/admin")) return <footer className="border-t border-slate-200 bg-white px-6 py-4 text-sm text-slate-600"><span>© {new Date().getFullYear()} Сэмжид Хужирт</span><button onClick={openPreferences} className="ml-5 min-h-11 text-teal underline">{lang === "mn" ? "Күүкийн тохиргоо" : "Cookie preferences"}</button></footer>;
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
            {[["/",t.nav.home],["/about",t.nav.about],["/services",t.nav.services],["/contact",{mn:"Холбоо барих",en:"Contact"}],["/rooms",t.nav.rooms],["/booking",t.nav.booking],["/faq", {mn:"Тусламж", en:"FAQ"}],["/cookies",{mn:"Күүкийн бодлого",en:"Cookie policy"}],["/privacy",t.footer.privacy],["/terms",t.footer.terms],["/refund-policy",t.footer.refund]].map(([href,label]) => (
              <li key={href as string}>
                <Link href={href as string} className="text-[13px] text-slate-500 hover:text-white no-underline transition-colors">
                  {(label as {mn:string;en:string})[lang]}
                </Link>
              </li>
            ))}
            <li><button type="button" onClick={openPreferences} className="min-h-11 text-sm text-slate-300 underline hover:text-white">{lang === "mn" ? "Күүкийн тохиргоо" : "Cookie preferences"}</button></li>
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
            <li>
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-300 underline hover:text-white">
                <Facebook aria-hidden="true" size={16} />
                {lang === "mn" ? "Facebook хуудас" : "Visit Facebook"}
                <span className="sr-only">{lang === "mn" ? " · Шинэ табд нээгдэнэ" : " · Opens in a new tab"}</span>
              </a>
            </li>
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
