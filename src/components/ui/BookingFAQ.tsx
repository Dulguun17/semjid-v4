"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";

const questions = [
  { q: { mn: "Хамтын өрөөний ор хэрхэн сонгох вэ?", en: "How does shared-room booking work?" }, a: { mn: "Зочин бүрт нэг ор сонгоно. Нэг өрөөнд ижил хүйсийн зочид байрлах дүрэмтэй. Огноонд боломжтой өрөө, орнуудаас сонгож, хадгалахын өмнө нийт үнээ шалгана.", en: "Select one bed per guest. Guests sharing a room must have the same known gender. Choose from beds available for your dates and review the total before saving." } },
  { q: { mn: "Бэлэн мөнгөөр төлж болох уу?", en: "Can I pay cash?" }, a: { mn: "Тийм. Бэлэн төлбөрийг хүлээн авалтад өгнө. Ажилтан хүлээн авсан дүнг бүртгэнэ. Ажилтан бэлэн болон банкны шилжүүлгийн хэсэгчилсэн төлбөрийг бүртгэж болно.", en: "Yes. Pay cash at reception and staff record the amount received. Staff can record split cash and bank payments." } },
  { q: { mn: "Банкны шилжүүлэг хэзээ баталгаажих вэ?", en: "When is a bank transfer verified?" }, a: { mn: "Албан ёсны дансны мэдээллийг хүлээн авалтаас авна. Ажилтан мөнгө хүлээн авсныг шалгах хүртэл шилжүүлэг хүлээгдэнэ. Хүлээгдэж буй дүн нь хүлээн авсан төлбөрт орохгүй.", en: "Obtain official bank details from reception. A transfer stays pending until staff manually verify receipt. Pending amounts do not count as money received." } },
  { q: { mn: "Ирэхдээ юу бэлдэх вэ?", en: "What should I prepare before arrival?" }, a: { mn: "Зочин бүр илгээх бичгийг татаж, хэвлэж, бөглүүлэн авч ирнэ. Иргэний үнэмлэх, холбогдох эмнэлгийн бичиг баримт, хувийн хэрэгслээ бэлдэнэ. Дэлгэрэнгүйг ирэхийн өмнөх санамжаас харна уу.", en: "Every guest must download, print, complete and bring the referral form. Prepare your ID, relevant medical records and personal essentials. See the arrival checklist for details." } },
  { q: { mn: "Үнэд юу багтах вэ?", en: "What is included in the price?" }, a: { mn: "Өрөөний тоноглолыг тухайн өрөөний картанд харуулна. Сонгосон огноо, зочдын нийт үнийг захиалгын хураангуйгаас шалгана. Хүүхдийн үнэ, хоол, эмчилгээ, багцын агуулгыг хүлээн авалтаас тодруулна. Эмчилгээ нь эмчийн зөвлөгөөнөөс хамаарна.", en: "Room facilities are listed on each room card. Review the total for your dates and guests in the booking summary. Confirm child rates, meals, treatments and package inclusions with reception. Treatments depend on a clinical consultation." } },
  { q: { mn: "Хугацаа, өөрчлөлт, цуцлалтыг хаанаас тодруулах вэ?", en: "Where can I confirm stay length, changes or cancellation?" }, a: { mn: "Огноо сонгох хэсэгт тухайн үеийн байрлах хугацааг харуулна. Өөрчлөлт, цуцлалт, буцаалтын нөхцөлийг хүлээн авалтаас захиалга баталгаажуулахын өмнө тодруулна уу.", en: "The date selector shows the current stay length. Ask reception to confirm change, cancellation and refund terms before confirming your booking." } },
];

export function BookingFAQ() {
  const { lang } = useLang();
  return (
    <section aria-labelledby="booking-faq-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <h2 id="booking-faq-heading" className="font-serif text-2xl text-slate-900">{lang === "mn" ? "Захиалгын түгээмэл асуултууд" : "Booking questions"}</h2>
      <div className="mt-4 divide-y divide-slate-200">
        {questions.map(item => <details key={item.q.en} className="group py-4"><summary className="min-h-11 cursor-pointer text-base font-semibold leading-7 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal">{item.q[lang]}</summary><p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">{item.a[lang]}</p></details>)}
      </div>
      <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold text-teal underline">{lang === "mn" ? "Хүлээн авалттай холбогдох" : "Contact reception"}</Link>
    </section>
  );
}
