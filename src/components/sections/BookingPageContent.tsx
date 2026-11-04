"use client";

import { AlertCircle } from "lucide-react";
import { useLang } from "@/lib/lang-context";

export function BookingPageContent() {
  const { lang } = useLang();

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <AlertCircle aria-hidden="true" className="mt-1 shrink-0 text-amber-700" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {lang === "mn" ? "Онлайн захиалга түр хаалттай" : "Online booking is currently closed"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {lang === "mn"
                ? "Одоогоор хүсэлт илгээх, ор түр хадгалах, захиалга баталгаажуулах боломжгүй. Энэ хуудсаар баталгаажуулалт эсвэл төлбөрийн баримт үүсэхгүй."
                : "You cannot submit a request, hold a bed, or confirm a reservation online right now. This page will not create a confirmation or payment receipt."}
            </p>
          </div>
        </div>

        <ol className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          {[
            lang === "mn" ? "1. Байрлах огноо" : "1. Stay dates",
            lang === "mn" ? "2. Тусдаа ор сонгох" : "2. Select individual beds",
            lang === "mn" ? "3. Зочны мэдээлэл" : "3. Guest details",
            lang === "mn" ? "4. Эцсийн үнийн санал" : "4. Final price review",
            lang === "mn" ? "5. Ажилтнаар баталгаажуулах" : "5. Staff confirmation",
          ].map(step => (
            <li key={step} className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">{step}</li>
          ))}
        </ol>

        <div className="mt-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p>
            <strong>{lang === "mn" ? "Төлбөр:" : "Payment:"}</strong>{" "}
            {lang === "mn"
              ? "QPay болон онлайн төлбөр холбогдоогүй. Онлайн төлбөр бүү илгээнэ үү. Хүлээн авалтад бэлэн мөнгө эсвэл ажилтнаар баталгаажуулах банкны шилжүүлэг дэмжинэ."
              : "QPay and online payment are not connected. Do not send an online payment. Reception supports cash or a bank transfer verified by staff."}
          </p>
          <p>
            <strong>{lang === "mn" ? "Нөхцөл:" : "Terms:"}</strong>{" "}
            {lang === "mn"
              ? "Цуцлалт, буцаалтын нөхцөл нийтлэхээр баталгаажаагүй. Эдгээрийг бизнесийн эзэн захиалга нээхээс өмнө шийдэх шаардлагатай."
              : "Cancellation and refund terms have not been approved for publication. The business owner must decide them before bookings reopen."}
          </p>
        </div>
      </section>
    </main>
  );
}
