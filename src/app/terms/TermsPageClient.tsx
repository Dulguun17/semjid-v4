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
              ? "Энэхүү нөхцөл нь таны захиалга, төлбөр, цуцалгаа болон үйлчилгээтэй холбоотой эрх, үүргийг тодорхойлно."
              : "These terms define your rights and obligations for bookings, payments, cancellations, and services."}
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">{lang === "mn" ? "Захиалга ба төлбөр" : "Booking and Payment"}</h2>
          <p className="text-slate-500 leading-relaxed">
            {lang === "mn"
              ? "Захиалгыг баталгаажуулахын тулд төлбөрийг QPay, картаар эсвэл банкны шилжүүлгээр дамжуулж болно."
              : "To confirm your reservation, payment can be made via QPay, card, or bank transfer."}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">{lang === "mn" ? "Цуцлах нөхцөл" : "Cancellation Policy"}</h2>
          <p className="text-slate-500 leading-relaxed">
            {lang === "mn"
              ? "Цуцлах үед тухайн нөхцөлөөс хамааран урьдчилгаа буцах эсэх нь тодорхойлогдоно."
              : "Cancellation refunds depend on the policy in effect at the time of booking."}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">{lang === "mn" ? "Эрүүл ахуй" : "Health Requirements"}</h2>
          <p className="text-slate-500 leading-relaxed">
            {lang === "mn"
              ? "Эмнэлгийн илгээх бичиг, шинжилгээ, даатгалын бичиг зэрэг материалыг авч ирэх шаардлагатай."
              : "Medical referral forms and supporting documents may be required for treatment."}
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
