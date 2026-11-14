"use client";
import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { MESSENGER_URL, PHONE1 } from "@/lib/data";

export function BookingCTA() {
  const { lang } = useLang();
  return (
    <section className="bg-teal-dark py-16 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="font-serif text-[clamp(26px,3.5vw,46px)] text-white leading-tight">
            {lang==="mn"?"Эрүүлээр урт насалъя":"Plan Your Stay at Semjid"}
          </h2>
          <p className="text-[14px] text-white/50 mt-2">{lang==="mn"?"Хүлээн авалтад бэлэн төлөх эсвэл ажилтнаар баталгаажуулах банкны шилжүүлэг хийнэ.":"Pay cash at reception or use a bank transfer verified by staff."}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap xl:w-auto xl:max-w-xl xl:shrink-0">
          <Link href="/booking" className="text-[13px] font-medium bg-white text-teal-dark hover:bg-slate-100 px-8 py-3.5 rounded text-center no-underline transition-colors">
            {lang==="mn"?"Онлайн захиалга":"Book Online"}
          </Link>
          <a href={`tel:${PHONE1.replace(/-/g,"")}`} className="text-[13px] font-medium border border-white/30 hover:border-white text-white px-8 py-3.5 rounded text-center no-underline transition-colors flex items-center justify-center gap-2">
            <Phone size={13}/> {PHONE1}
          </a>
          <a href={MESSENGER_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/30 px-6 py-3.5 text-center text-sm font-medium text-white hover:border-white">
            <MessageCircle aria-hidden="true" size={16} />
            {lang === "mn" ? "Messenger-ээр холбогдох" : "Message on Messenger"}
            <span className="sr-only">{lang === "mn" ? " · Шинэ табд нээгдэнэ" : " · Opens in a new tab"}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
