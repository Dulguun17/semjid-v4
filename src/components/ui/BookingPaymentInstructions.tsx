"use client";
import { useLang } from "@/lib/lang-context";
import { PHONE1 } from "@/lib/data";

export function BookingPaymentInstructions() {
  const { lang } = useLang();
  return <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
    <p>{lang === "mn"
      ? "Бэлэн төлбөрийг хүлээн авалтад өгнө. Банкны шилжүүлгийн албан ёсны мэдээллийг хүлээн авалтаас лавлана уу."
      : "Pay cash at reception. Obtain the official bank-transfer instructions from reception."}</p>
    <p>{lang === "mn"
      ? "Төлбөрөө бэлэн болон банкны шилжүүлгээр хэсэгчлэн хийж болно. Ажилтан шилжүүлгийг хүлээн авсныг шалгасны дараа хүлээн авсан дүн, үлдэгдэл шинэчлэгдэнэ."
      : "You can split payments between cash and bank transfer. Received totals and the balance update after staff verify a transfer was received."}</p>
    <p>{lang === "mn" ? "Хүлээгдэж буй шилжүүлэг нь хүлээн авсан мөнгөнд орохгүй." : "A pending transfer does not count as money received."}</p>
    <a href={`tel:${PHONE1.replaceAll("-", "")}`} className="inline-block font-semibold text-teal underline">{lang === "mn" ? "Хүлээн авалт" : "Reception"} · {PHONE1}</a>
  </div>;
}
