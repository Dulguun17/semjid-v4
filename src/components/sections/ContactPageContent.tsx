"use client";
import Link from "next/link";
import { MapPin, MessageCircle, Phone, Navigation } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { FACEBOOK_URL, MESSENGER_URL, PHONE1, PHONE2, t } from "@/lib/data";
import { MAP_DIRECTIONS_URL, MAP_SEARCH_URL } from "@/lib/business";

export function ContactPageContent() {
  const { lang } = useLang();
  const link = "inline-flex min-h-12 items-center gap-2 rounded-lg border border-teal/40 bg-white px-4 py-3 font-semibold text-teal underline";
  return <main className="mx-auto max-w-5xl space-y-7 px-5 py-10 text-slate-700">
    <header><h1 className="font-serif text-3xl text-slate-900">{lang === "mn" ? "Хүлээн авалттай холбогдох" : "Contact reception"}</h1><p className="mt-4 max-w-2xl text-base leading-7">{lang === "mn" ? "Өрөө, байрлах хугацаа, ирэхийн өмнөх бэлтгэл болон банкны шилжүүлгийн одоогийн зааврыг хүлээн авалтаас тодруулна уу." : "Ask reception about rooms, stay dates, arrival preparation and current bank-transfer instructions."}</p></header>
    <div className="grid gap-5 md:grid-cols-2">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold text-slate-900">{lang === "mn" ? "Утас ба мессеж" : "Call or message"}</h2>
        <div className="flex flex-wrap gap-3">{[PHONE1, PHONE2].map(phone => <a key={phone} href={`tel:${phone.replaceAll("-", "")}`} className={link}><Phone size={18} aria-hidden="true" />{phone}</a>)}</div>
        <a href={MESSENGER_URL} target="_blank" rel="noopener noreferrer" className={link}><MessageCircle size={18} aria-hidden="true" />{lang === "mn" ? "Messenger-ээр холбогдох" : "Message on Messenger"}</a>
        <p><a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="inline-block min-h-11 py-2 text-teal underline">{lang === "mn" ? "Facebook хуудас" : "Visit Facebook"}</a></p>
        <p className="text-sm leading-6">{lang === "mn" ? "Гаднын холбоос шинэ табд нээгдэнэ. Нийтийн мессежид эмнэлгийн болон нууц мэдээлэл бүү оруулаарай." : "External links open in a new tab. Keep medical and confidential details out of public messages."}</p>
      </section>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900"><MapPin size={20} aria-hidden="true" />{lang === "mn" ? "Байршил, хүрэх зам" : "Location and directions"}</h2>
        <p>{t.footer.addr[lang]}</p><div className="flex flex-wrap gap-3"><a href={MAP_SEARCH_URL} target="_blank" rel="noopener noreferrer" className={link}>{lang === "mn" ? "Газрын зураг нээх" : "Open map"}</a><a href={MAP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className={link}><Navigation size={18} aria-hidden="true" />{lang === "mn" ? "Чиглэл авах" : "Get directions"}</a></div>
        <p className="text-sm leading-6">{lang === "mn" ? "Google Maps-д бизнесийн нэр, Хужирт байршлаар хайна. Аяллынхаа өмнө очих цэг, тээврийн хуваарийг хүлээн авалтаас баталгаажуулна уу." : "Google Maps searches the business name and Khujirt locality. Confirm the arrival point and transport arrangements with reception before travelling."}</p>
      </section>
    </div>
    <nav aria-label={lang === "mn" ? "Захиалгын мэдээлэл" : "Plan your visit"} className="flex flex-wrap gap-4">{[["/rooms",lang === "mn" ? "Өрөө, үнэ" : "Rooms and rates"],["/booking",lang === "mn" ? "Байрлах өдрөө сонгох" : "Plan your stay"],["/faq",lang === "mn" ? "Захиалгын асуултууд" : "Booking questions"]].map(([href,label]) => <Link key={href} href={href} className="min-h-11 rounded-lg bg-teal px-5 py-3 font-semibold text-white">{label}</Link>)}</nav>
  </main>;
}
