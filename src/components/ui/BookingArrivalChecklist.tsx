"use client";

import { FileText, CheckCircle2 } from "lucide-react";
import { PHONE1 } from "@/lib/data";
import { useLang } from "@/lib/lang-context";

export function BookingArrivalChecklist() {
  const { lang } = useLang();
  const items = [
    { mn: "Иргэний үнэмлэх, хүүхдийн төрсний гэрчилгээгээ авч ирнэ үү.", en: "Bring your national ID and a birth certificate for children." },
    { mn: "Холбогдох эмнэлгийн гар карт, өмнө хийлгэсэн шинжилгээний хариугаа авч ирнэ үү.", en: "Bring relevant medical records and existing test results." },
    { mn: "Ванны алчуур, усны шаахай болон хувийн хэрэгслээ бэлдэнэ үү.", en: "Pack a bath towel, slippers and personal essentials." },
  ];

  return (
    <section aria-labelledby="arrival-heading" className="grid gap-6 rounded-2xl border border-teal/20 bg-white p-5 sm:p-7 md:grid-cols-2">
      <div className="space-y-3">
        <FileText aria-hidden="true" className="text-teal" size={28} />
        <h2 className="text-xl font-semibold text-slate-900">{lang === "mn" ? "Илгээх бичиг" : "Medical referral form"}</h2>
        <p className="text-base leading-7 text-slate-700">{lang === "mn" ? "Зочин бүр илгээх бичгийг татаж, хэвлэж, бөглүүлэн ирэхдээ заавал авч ирнэ." : "Every guest must download, print and complete the referral form, then bring it on arrival."}</p>
        <a href="/forms/semjid-ilgeeh-bichig.pdf" download="semjid-ilgeeh-bichig.pdf" className="inline-flex min-h-12 items-center rounded-lg bg-teal px-5 py-3 text-base font-semibold text-white">{lang === "mn" ? "Илгээх бичиг татах · PDF" : "Download referral form · PDF"}</a>
        <a href={`tel:${PHONE1.replaceAll("-", "")}`} className="inline-flex min-h-11 items-center font-semibold text-teal underline">{lang === "mn" ? "Маягтыг хүлээн авалтаас авах" : "Get the form from reception"} · {PHONE1}</a>
      </div>
      <div>
        <h2 id="arrival-heading" className="text-xl font-semibold text-slate-900">{lang === "mn" ? "Ирэхийн өмнө" : "Before you arrive"}</h2>
        <ul className="mt-4 space-y-4">
          {items.map(item => <li key={item.en} className="flex gap-3 text-base leading-7 text-slate-700"><CheckCircle2 aria-hidden="true" size={20} className="mt-1 shrink-0 text-teal" /><span>{item[lang]}</span></li>)}
        </ul>
      </div>
    </section>
  );
}
