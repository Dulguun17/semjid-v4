"use client";

import { BedDouble, ClipboardCheck, Stethoscope, Luggage } from "lucide-react";
import { useLang } from "@/lib/lang-context";

const steps = [
  { icon: BedDouble, title: { mn: "Байрлах өдрөө сонгох", en: "Choose your stay" }, text: { mn: "Огноо, өрөө, ор болон нийт үнээ шалгаад хүсэлтээ хадгална. Ажилтан захиалгыг баталгаажуулна.", en: "Review dates, room, beds and total before saving your request. Staff confirm your booking." } },
  { icon: ClipboardCheck, title: { mn: "Хүлээн авалтад бүртгүүлэх", en: "Check in" }, text: { mn: "Иргэний үнэмлэх, бөглөсөн илгээх бичиг болон холбогдох бичиг баримтаа авч ирнэ.", en: "Bring your ID, completed referral form and relevant documents to reception." } },
  { icon: Stethoscope, title: { mn: "Эмчтэй зөвлөлдөх", en: "Have a consultation" }, text: { mn: "Эмчилгээний тохирох сонголтыг эмчтэй зөвлөлдөнө. Багцад багтах үйлчилгээ, үнийг хүлээн авалтаас тодруулна.", en: "Discuss suitable treatments with the clinician. Confirm package services and prices with reception." } },
  { icon: Luggage, title: { mn: "Байрлах, буцах", en: "Stay and check out" }, text: { mn: "Байрлах хугацааны асуултаа хүлээн авалтаас лавлаж, буцахдаа бүртгэл, төлбөрийн үлдэгдлээ шалгуулна.", en: "Ask reception for help during your stay and review your booking and payment balance at checkout." } },
];

export function BookingWhatToExpect() {
  const { lang } = useLang();
  return (
    <section aria-labelledby="expect-heading" className="rounded-2xl bg-[#eaf1ee] p-5 sm:p-7">
      <h2 id="expect-heading" className="font-serif text-2xl text-slate-900">{lang === "mn" ? "Таны аяллын дараалал" : "What to expect"}</h2>
      <ol className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title.en}>
            <div className="mb-3 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-teal"><Icon aria-hidden="true" size={24} /></span><span className="text-sm font-semibold text-teal">0{index + 1}</span></div>
            <h3 className="text-base font-semibold text-slate-900">{title[lang]}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{text[lang]}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
