"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";

export default function TermsPageClient() {
  const { lang } = useLang();

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 min-h-[70vh]">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-teal font-semibold uppercase tracking-[0.24em]">
            {lang === "mn" ? "Үйлчилгээний нөхцөл" : "Terms & Conditions"}
          </p>
          <h1 className="text-3xl font-serif text-slate-900">
            {lang === "mn" ? "Захиалгын нөхцөл" : "Reservation Terms"}
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            {lang === "mn"
              ? "Захиалга баталгаажуулахын өмнө байрлах хугацаа, үйлчилгээ, төлбөр болон цуцлалтын нөхцөлөө хүлээн авалтаас тодруулна уу."
              : "Confirm your stay, services, payment and cancellation terms with reception before confirming a booking."}
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">{lang === "mn" ? "Захиалга ба төлбөр" : "Booking and Payment"}</h2>
          <p className="text-slate-500 leading-relaxed">
            {lang === "mn"
              ? "Захиалгыг ажилтан баталгаажуулна. Хүлээн авалтад бэлэн төлөх эсвэл банкны шилжүүлэг хийж болно. Шилжүүлгийг ажилтан шалгах хүртэл хүлээгдэж буй төлбөрт бүртгэнэ."
              : "Staff confirm bookings. Pay cash at reception or by bank transfer. Transfers remain pending until staff verify receipt."}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">{lang === "mn" ? "Цуцлах нөхцөл" : "Cancellation Policy"}</h2>
          <p className="text-slate-500 leading-relaxed">
            {lang === "mn"
              ? "Өөрчлөлт, цуцлалт, буцаалтын нөхцөлөө захиалга баталгаажуулахын өмнө хүлээн авалтаас тодруулна уу."
              : "Ask reception to confirm change, cancellation and refund terms before confirming your booking."}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">{lang === "mn" ? "Эрүүл ахуй" : "Health Requirements"}</h2>
          <p className="text-slate-500 leading-relaxed">
            {lang === "mn"
              ? "Зочин бүр илгээх бичгийг татаж, хэвлэж, бөглүүлэн авч ирнэ. Захиалгын хуудсан дахь ирэхийн өмнөх санамжийг шалгана уу."
              : "Every guest must download, print, complete and bring the referral form. Review the arrival checklist on the booking page."}
          </p>
        </section>

        <div className="pt-8 border-t border-slate-200">
          <Link href="/" className="text-teal hover:text-teal-dark text-sm font-medium">
            {lang === "mn" ? "Нүүр хуудас руу буцах" : "Back to home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
