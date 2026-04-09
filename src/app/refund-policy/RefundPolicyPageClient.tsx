"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";

export default function RefundPolicyPageClient() {
  const { lang } = useLang();

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 min-h-[70vh]">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-teal font-semibold uppercase tracking-[0.24em]">
            {lang === "mn" ? "Цуцлах болон нөхөн төлөх" : "Cancellation & Refund"}
          </p>
          <h1 className="text-3xl font-serif text-slate-900">
            {lang === "mn" ? "Урьдчилгаа ба буцаалт" : "Deposit and Refund"}
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            {lang === "mn"
              ? "Захиалга цуцлах нөхцөл, буцаах урьдчилгаа болон үйлчилгээний өөрчлөлтийн журмыг эндээс үзнэ үү."
              : "Review cancellation terms, deposit refund rules, and service change procedures here."}
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">{lang === "mn" ? "Цуцлах" : "Cancellation"}</h2>
          <p className="text-slate-500 leading-relaxed">
            {lang === "mn"
              ? "Цуцлах хүсэлтийг аль болох эрт илгээхийг зөвлөж байна. Цуцлах хугацаанаас хамааран урьдчилгаа хэсэгчлэн буцаж болох юм."
              : "Please submit cancellations as early as possible. Refunds may be partial depending on the notice period."}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">{lang === "mn" ? "Буцаалт" : "Refunds"}</h2>
          <p className="text-slate-500 leading-relaxed">
            {lang === "mn"
              ? "Хэрэв урьдчилгаа төлсөн бол нөхцөлөөс хамааран банкны шилжүүлгээр буцаах болно."
              : "If a deposit has been paid, refunds will be issued by bank transfer according to the policy."}
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
