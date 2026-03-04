"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Phone } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, PHONE1, PHONE2 } from "@/lib/data";
import clsx from "clsx";

export function Navbar() {
  const { lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { href: "/",         label: t.nav.home },
    { href: "/about",    label: t.nav.about },
    { href: "/services", label: t.nav.services },
    { href: "/rooms",    label: t.nav.rooms },
  ];

  return (
    <header className={clsx(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "shadow-md" : ""
    )}>
      {/* Top bar — phone + language */}
      <div className="bg-primary text-white hidden md:block">
        <div className="max-w-7xl mx-auto px-6 lg:px-14 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href={`tel:+976${PHONE1.replace(/-/g,"")}`} className="flex items-center gap-1.5 text-white/80 hover:text-white no-underline cursor-none text-xs">
              <Phone size={11} /> {PHONE1}
            </a>
            <a href={`tel:+976${PHONE2.replace(/-/g,"")}`} className="flex items-center gap-1.5 text-white/80 hover:text-white no-underline cursor-none text-xs">
              <Phone size={11} /> {PHONE2}
            </a>
          </div>
          <div className="flex items-center gap-1">
            {(["mn","en"] as const).map((l, i) => (
              <span key={l} className="flex items-center">
                <button onClick={() => setLang(l)} className={clsx(
                  "text-xs px-1 cursor-none transition-colors",
                  lang === l ? "text-white font-medium" : "text-white/50 hover:text-white"
                )}>{l === "mn" ? "МОН" : "ENG"}</button>
                {i === 0 && <span className="text-white/30 text-xs">|</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main nav — white with centered logo like reference */}
      <nav className="bg-white border-b border-gray-100 ornament-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-14">
          <div className="flex items-center justify-between py-3">
            {/* Left links */}
            <div className="hidden md:flex items-center gap-8">
              {links.slice(0,2).map(l => (
                <Link key={l.href} href={l.href}
                  className={clsx("font-body text-[11px] tracking-[0.18em] uppercase no-underline transition-colors cursor-none",
                    pathname === l.href ? "text-primary font-medium border-b-2 border-primary pb-0.5" : "text-steel hover:text-primary"
                  )}>
                  {l.label[lang]}
                </Link>
              ))}
            </div>

            {/* Centered logo */}
            <Link href="/" className="flex flex-col items-center cursor-none mx-4">
              <div className="relative w-14 h-14 mb-1">
                <Image src="/images/logo-deer.png" alt="Semjid Khujirt" fill className="object-contain" />
              </div>
              <div className="font-body text-[9px] tracking-[0.25em] uppercase text-steel text-center leading-tight">
                СЭМЖИД ХУЖИРТ
              </div>
              <div className="font-body text-[8px] tracking-[0.15em] uppercase text-steel/60 text-center">
                РАШААН СУВИЛАЛ
              </div>
            </Link>

            {/* Right links */}
            <div className="hidden md:flex items-center gap-8">
              {links.slice(2).map(l => (
                <Link key={l.href} href={l.href}
                  className={clsx("font-body text-[11px] tracking-[0.18em] uppercase no-underline transition-colors cursor-none",
                    pathname === l.href ? "text-primary font-medium border-b-2 border-primary pb-0.5" : "text-steel hover:text-primary"
                  )}>
                  {l.label[lang]}
                </Link>
              ))}
              <Link href="/booking"
                className="font-body text-[10px] tracking-[0.2em] uppercase bg-primary hover:bg-primary-dark text-white px-5 py-2 no-underline transition-colors cursor-none">
                {t.nav.booking[lang]}
              </Link>
            </div>

            {/* Mobile */}
            <button onClick={() => setOpen(!open)} className="md:hidden cursor-none text-primary">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 py-6 px-6 shadow-lg">
          <div className="flex flex-col gap-5">
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="font-body text-[11px] tracking-[0.2em] uppercase text-deep no-underline cursor-none">
                {l.label[lang]}
              </Link>
            ))}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              {(["mn","en"] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={clsx("font-body text-[10px] px-4 py-2 cursor-none border",
                    lang === l ? "bg-primary text-white border-primary" : "border-primary/20 text-steel"
                  )}>
                  {l === "mn" ? "МОН" : "ENG"}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <a href={`tel:+976${PHONE1.replace(/-/g,"")}`} className="font-body text-sm text-primary no-underline cursor-none">{PHONE1}</a>
              <a href={`tel:+976${PHONE2.replace(/-/g,"")}`} className="font-body text-sm text-primary no-underline cursor-none">{PHONE2}</a>
            </div>
            <Link href="/booking" onClick={() => setOpen(false)}
              className="font-body text-[10px] tracking-widest uppercase bg-primary text-white px-5 py-3 text-center no-underline cursor-none">
              {t.nav.booking[lang]}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
