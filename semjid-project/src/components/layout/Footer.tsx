"use client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Facebook } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, PHONE1, PHONE2 } from "@/lib/data";

export function Footer() {
  const { lang } = useLang();
  return (
    <footer className="bg-deep text-white/60 pt-14 pb-7 px-6 lg:px-14">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-14 h-14">
                <Image src="/images/logo-deer.png" alt="Semjid Khujirt" fill className="object-contain" />
              </div>
              <div>
                <div className="font-display text-white font-semibold text-xl leading-tight">Сэмжид Хужирт</div>
                <div className="font-body text-[9px] tracking-[0.25em] uppercase text-white/40">РАШААН СУВИЛАЛ · {t.footer.founded[lang]}</div>
              </div>
            </div>
            <p className="font-body text-sm leading-relaxed mb-5 max-w-xs">{t.footer.tagline[lang]}</p>
            <a href="https://www.facebook.com/profile.php?id=semjidkhujirt" target="_blank" rel="noreferrer"
              className="w-9 h-9 border border-white/15 hover:border-gold hover:text-gold flex items-center justify-center transition-colors cursor-none inline-flex">
              <Facebook size={15} />
            </a>
          </div>

          <div>
            <h4 className="font-body text-[9px] tracking-[0.4em] uppercase text-primary mb-5">{t.footer.explore[lang]}</h4>
            <ul className="space-y-3 list-none">
              {[
                ["/",         t.nav.home[lang]],
                ["/about",    t.nav.about[lang]],
                ["/services", t.nav.services[lang]],
                ["/rooms",    t.nav.rooms[lang]],
                ["/booking",  t.nav.booking[lang]],
              ].map(([href, label]) => (
                <li key={href}><Link href={href as string} className="font-body text-sm text-white/50 hover:text-white no-underline transition-colors cursor-none">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-body text-[9px] tracking-[0.4em] uppercase text-primary mb-5">{t.footer.contact[lang]}</h4>
            <ul className="space-y-4 list-none">
              <li className="flex items-start gap-3">
                <MapPin size={12} className="text-primary mt-0.5 shrink-0" />
                <span className="font-body text-sm text-white/50">{t.footer.address[lang]}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={12} className="text-primary shrink-0" />
                <div className="flex flex-col gap-1">
                  <a href={`tel:+976${PHONE1.replace(/-/g,"")}`} className="font-body text-sm text-white/50 hover:text-white no-underline cursor-none">{PHONE1}</a>
                  <a href={`tel:+976${PHONE2.replace(/-/g,"")}`} className="font-body text-sm text-white/50 hover:text-white no-underline cursor-none">{PHONE2}</a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={12} className="text-primary shrink-0" />
                <a href="mailto:info@semjidkhujirt.mn" className="font-body text-sm text-white/50 hover:text-white no-underline cursor-none">info@semjidkhujirt.mn</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="font-body text-[11px] text-white/20">© {new Date().getFullYear()} "ТОБАСЭ ХХК" — Сэмжид Хужирт Рашаан Сувилал. {t.footer.rights[lang]}</p>
          <p className="font-body text-[10px] text-white/20">www.facebook.com/Сэмжид-Хужирт</p>
        </div>
      </div>
    </footer>
  );
}
