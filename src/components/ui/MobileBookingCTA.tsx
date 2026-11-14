"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { PHONE1 } from "@/lib/data";

export function MobileBookingCTA() {
  const path = usePathname(); const { lang } = useLang();
  if (!["/", "/about", "/rooms", "/services", "/faq", "/contact"].includes(path)) return null;
  return <nav data-mobile-cta aria-label={lang === "mn" ? "Захиалгын холбоос" : "Booking actions"} className="mobile-booking-cta">
    <Link href="/booking" className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white">{lang === "mn" ? "Захиалга төлөвлөх" : "Plan your stay"}</Link>
    <a href={`tel:${PHONE1.replaceAll("-", "")}`} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-teal px-3 py-2 text-sm font-semibold text-teal"><Phone aria-hidden="true" size={16} />{lang === "mn" ? "Хүлээн авалт" : "Call reception"}</a>
  </nav>;
}
