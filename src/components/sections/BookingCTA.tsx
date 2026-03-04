"use client";
import Link from "next/link";
import { Phone } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { PHONE1 } from "@/lib/data";

export function BookingCTA() {
  const { lang } = useLang();
  return (
    <section className="bg-teal-dark py-16 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="font-serif text-[clamp(26px,3.5vw,46px)] text-white leading-tight">
            {lang==="mn"?"Одоо захиалга өгч\nэрүүлжилтээ эхлүүлэ":"Book Now &\nBegin Your Healing"}
          </h2>
          <p className="text-[14px] text-white/50 mt-2">{lang==="mn"?"QPay, карт болон банкны шилжүүлгээр төлнө үү.":"Pay via QPay, card, or bank transfer."}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link href="/booking" className="text-[13px] font-medium bg-white text-teal-dark hover:bg-slate-100 px-8 py-3.5 rounded text-center no-underline transition-colors">
            {lang==="mn"?"Онлайн захиалга":"Book Online"}
          </Link>
          <a href={`tel:${PHONE1.replace(/-/g,"")}`} className="text-[13px] font-medium border border-white/30 hover:border-white text-white px-8 py-3.5 rounded text-center no-underline transition-colors flex items-center justify-center gap-2">
            <Phone size={13}/> {PHONE1}
          </a>
        </div>
      </div>
    </section>
  );
}
