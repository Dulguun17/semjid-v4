"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";

export default function PrivacyPageClient() {
  const { lang } = useLang();

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 min-h-[70vh]">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-teal font-semibold uppercase tracking-[0.24em]">
            {lang === "mn" ? "Нууцлалын бодлого" : "Privacy Policy"}
          </p>
          <h1 className="text-3xl font-serif text-slate-900">
            {lang === "mn" ? "Өөрийн мэдээллээ хэрхэн хамгаалдаг вэ" : "How We Protect Your Information"}
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            {lang === "mn"
              ? "Тухайн вебсайт нь хэрэглэгчийн хувийн мэдээллийг зөвхөн захиалга, харилцаа холбоо, үйлчилгээ сайжруулах зорилгоор ашигладаг."
              : "This website uses personal data only for booking, communication, and service improvement purposes."}
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">{lang === "mn" ? "Мэдээлэл цуглуулах" : "Information We Collect"}</h2>
          <p className="text-slate-500 leading-relaxed">
            {lang === "mn"
              ? "Захиалга хийх үед бид таны нэр, утас, имэйл зэрэг мэдээллийг авна. Энэ мэдээлэл нь таны захиалгыг боловсруулахад ашиглагдана."
              : "When making a reservation, we collect your name, phone, and email. This information is used to process your booking."}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">{lang === "mn" ? "Мэдээлэл хамгаалах" : "How We Protect Data"}</h2>
          <p className="text-slate-500 leading-relaxed">
            {lang === "mn"
              ? "Манай системд хадгалагдсан мэдээллийг зөвшөөрөлгүй хандалтаас хамгаалахын тулд хэрэгцээт нууцлал, нэвтрэх хязгаарлалтыг ашиглана."
              : "We use necessary security and access restrictions to protect stored data from unauthorized access."}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">{lang === "mn" ? "Холбоо барих" : "Contact"}</h2>
          <p className="text-slate-500 leading-relaxed">
            {lang === "mn"
              ? "Нууцлалын бодлогод асуулт байвал бидэнд утсаар эсвэл цахим шуудангаар хандаж болно."
              : "If you have questions about privacy, contact us by phone or email."}
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
