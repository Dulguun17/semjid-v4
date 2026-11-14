"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
const labels: Record<string, { mn: string; en: string }> = {
  "/about": { mn: "Бидний тухай", en: "About" }, "/rooms": { mn: "Өрөө", en: "Rooms" },
  "/services": { mn: "Үйлчилгээ", en: "Services" }, "/contact": { mn: "Холбоо барих", en: "Contact" },
  "/faq": { mn: "Асуултууд", en: "FAQ" }, "/booking": { mn: "Захиалга", en: "Booking" },
  "/booking/summary": { mn: "Хураангуй", en: "Review" }, "/booking/confirmation": { mn: "Хүсэлтийн үр дүн", en: "Request result" },
  "/rooms/availability": { mn: "Ор сонгох", en: "Choose beds" }, "/profile": { mn: "Миний бүртгэл", en: "My account" },
  "/login": { mn: "Нэвтрэх", en: "Sign in" }, "/signup": { mn: "Бүртгүүлэх", en: "Sign up" },
  "/privacy": { mn: "Нууцлал", en: "Privacy" }, "/cookies": { mn: "Күүки", en: "Cookies" },
  "/terms": { mn: "Нөхцөл", en: "Terms" }, "/refund-policy": { mn: "Цуцлалт, буцаалт", en: "Cancellation and refunds" },
};
export function Breadcrumbs() {
  const path = usePathname(); const { lang } = useLang();
  if (!labels[path]) return null;
  const segments = path.split("/").filter(Boolean);
  const paths = segments.map((_, index) => "/" + segments.slice(0,index + 1).join("/")).filter(value => labels[value]);
  return <nav aria-label={lang === "mn" ? "Хуудасны зам" : "Breadcrumb"} className="mx-auto max-w-7xl px-5 py-4 text-sm text-slate-600"><ol className="flex flex-wrap items-center gap-2"><li><Link href="/" className="inline-block min-h-11 py-3 text-teal underline">{lang === "mn" ? "Нүүр" : "Home"}</Link></li>{paths.map((value,index) => <li key={value} className="flex items-center gap-2"><ChevronRight aria-hidden="true" size={14} />{index === paths.length - 1 ? <span aria-current="page">{labels[value][lang]}</span> : <Link href={value} className="inline-block min-h-11 py-3 text-teal underline">{labels[value][lang]}</Link>}</li>)}</ol></nav>;
}
