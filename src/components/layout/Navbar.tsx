"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, User } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, PHONE1, PHONE2 } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const { lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const path = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const initials = (() => {
    const meta = authUser?.user_metadata || {};
    const f = meta.first_name?.[0] || "";
    const l = meta.last_name?.[0] || "";
    return (f + l).toUpperCase() || authUser?.email?.[0]?.toUpperCase() || "U";
  })();

  const links = [
    { href: "/",         label: t.nav.home },
    { href: "/about",    label: t.nav.about },
    { href: "/rooms",    label: t.nav.rooms },
    { href: "/services", label: t.nav.services },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="hidden md:block bg-teal text-white text-[11px] py-1.5 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="opacity-70">{lang === "mn" ? "Жилийн 4 улиралд нээлттэй · Өвөрхангай аймаг, Хужирт сум" : "Open Year-Round · Khujirt soum, Uvurkhangai aimag"}</span>
          <div className="flex items-center gap-4">
            <a href={`tel:${PHONE1.replace(/-/g,"")}`} className="flex items-center gap-1 opacity-80 hover:opacity-100 no-underline text-white">
              <Phone size={10} /> {PHONE1}
            </a>
            <a href={`tel:${PHONE2.replace(/-/g,"")}`} className="flex items-center gap-1 opacity-80 hover:opacity-100 no-underline text-white">
              <Phone size={10} /> {PHONE2}
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? "shadow-md" : "border-b border-slate-100"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <Image src="/images/logo.png" alt="Logo" fill sizes="48px" className="object-contain" />
            </div>
            <div>
              <div className="font-serif text-[15px] font-semibold text-teal-dark leading-tight">Сэмжид Хужирт</div>
              <div className="text-[9px] text-slate-400 tracking-[0.2em] uppercase leading-tight">Рашаан Сувилал</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`text-[13px] no-underline transition-colors ${path === l.href ? "text-teal font-semibold border-b-2 border-teal pb-0.5" : "text-slate-500 hover:text-teal"}`}>
                {l.label[lang]}
              </Link>
            ))}
            <div className="flex border border-slate-200 rounded overflow-hidden text-[11px]">
              {(["mn","en"] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1.5 transition-colors ${lang === l ? "bg-teal text-white" : "text-slate-400 hover:text-slate-600"}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            {authUser ? (
              <Link href="/profile" className="w-8 h-8 rounded-full bg-teal text-white text-[12px] font-semibold flex items-center justify-center hover:bg-teal-dark transition-colors no-underline" title={authUser.email}>
                {initials}
              </Link>
            ) : (
              <Link href="/login" className="text-[12px] text-slate-500 hover:text-teal transition-colors inline-flex items-center gap-1">
                <User size={13} />{lang === "mn" ? "Нэвтрэх" : "Login"}
              </Link>
            )}
            <Link href="/booking" className="text-[12px] font-medium bg-teal hover:bg-teal-dark text-white px-5 py-2 rounded no-underline transition-colors">
              {t.nav.booking[lang]}
            </Link>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden text-slate-600">
            {open ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>

        {open && (
          <div className="md:hidden bg-white border-t border-slate-100 py-5 px-6 space-y-4">
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="block text-[14px] text-slate-600 no-underline">{l.label[lang]}</Link>
            ))}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              {(["mn","en"] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`text-[11px] px-4 py-1.5 rounded border ${lang === l ? "bg-teal text-white border-teal" : "border-slate-200 text-slate-400"}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            {authUser ? (
              <Link href="/profile" onClick={() => setOpen(false)} className="block text-[13px] text-teal no-underline font-medium">
                {lang === "mn" ? "Миний профайл" : "My Profile"}
              </Link>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="block text-[13px] text-slate-600 no-underline">
                {lang === "mn" ? "Нэвтрэх" : "Login"}
              </Link>
            )}
            <Link href="/booking" onClick={() => setOpen(false)}
              className="block text-[13px] bg-teal text-white px-5 py-3 text-center no-underline rounded">
              {t.nav.booking[lang]}
            </Link>
            <a href={`tel:${PHONE1.replace(/-/g,"")}`} className="flex items-center gap-2 text-[13px] text-teal no-underline">
              <Phone size={14}/> {PHONE1}
            </a>
          </div>
        )}
      </nav>
    </>
  );
}
