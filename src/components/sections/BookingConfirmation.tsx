"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { bookingConfirmationStorageKey, customerBookingStatusLabel } from "@/lib/customer-booking";
import { workspaceSession } from "@/lib/workspace-api";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/lang-context";
import { formatMntAmount } from "@/lib/payment-ledger";
import { BookingPaymentInstructions } from "@/components/ui/BookingPaymentInstructions";

type SavedBooking = {
  id: string; ref: string; room_id: string; check_in: string; check_out: string; status: string; total: string | number; beds: string[];
  financials: { netReceived: string; remainingBalance: string | null; completeHistory: boolean };
};
export function BookingConfirmation() {
  const { lang } = useLang();
  const [booking, setBooking] = useState<SavedBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    let requestVersion = 0;
    const load = async () => {
      const version = ++requestVersion;
      const current = () => active && version === requestVersion;
      setBooking(null); setLoading(true); setMessage(""); setNeedsLogin(false);
      try {
        const session = await workspaceSession();
        if (!current()) return;
        const id = sessionStorage.getItem(bookingConfirmationStorageKey(session.user.id));
        if (!id) {
          if (current()) setMessage(lang === "mn" ? "Энэ табд шинэ хүсэлтийн үр дүн байхгүй. Миний захиалгуудаас одоогийн мэдээллээ шалгана уу." : "There is no recent request result in this tab. Check My Bookings for your current records.");
          return;
        }
        const response = await fetch("/api/customer/bookings", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
        if (!current()) return;
        if (response.status === 401) setNeedsLogin(true);
        if (!response.ok) throw new Error("Could not verify request");
        const result = await response.json();
        if (!current()) return;
        const saved = Array.isArray(result.bookings) ? result.bookings.find((row: SavedBooking) => row.id === id) : null;
        if (saved) setBooking(saved);
        else setMessage(lang === "mn" ? "Энэ бүртгэлээр хүсэлтийг олсонгүй. Миний захиалгуудыг шалгах эсвэл хүлээн авалттай холбогдоно уу." : "This request was not found for your account. Check My Bookings or contact reception.");
      } catch {
        if (current()) setMessage(lang === "mn" ? "Хадгалсан хүсэлтийн төлөвийг шалгаж чадсангүй. Нэвтэрч Миний захиалгуудаас шалгах эсвэл дахин оролдоно уу." : "The saved request could not be verified. Sign in and check My Bookings, or retry.");
      } finally { if (current()) setLoading(false); }
    };
    void load();
    let timer: ReturnType<typeof setTimeout>;
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === "INITIAL_SESSION") return;
      requestVersion++;
      setBooking(null);
      clearTimeout(timer);
      timer = setTimeout(() => void load(), 0);
    });
    return () => { active = false; clearTimeout(timer); data.subscription.unsubscribe(); };
  }, [lang, version]);
  return <main className="mx-auto max-w-3xl space-y-6 px-5 py-10 text-slate-700">
    <h1 className="font-serif text-3xl text-slate-900">{lang === "mn" ? "Таны захиалгын хүсэлт" : "Your booking request"}</h1>
    {loading && <p role="status">{lang === "mn" ? "Хүсэлтийн одоогийн төлөвийг шалгаж байна…" : "Checking the current request status…"}</p>}
    {message && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5">{message}</div>}
    {booking && <section aria-labelledby="request-result-heading" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 id="request-result-heading" className="text-xl font-semibold text-slate-900">{lang === "mn" ? "Баярлалаа. Хадгалсан хүсэлтийн одоогийн мэдээлэл" : "Thank you. Here is your saved request's current information"}</h2>
      <p className="text-sm leading-6">{lang === "mn" ? "Захиалгын баталгаажуулалт болон төлбөрийн баримт тусдаа бүртгэгдэнэ. Имэйл хүргэлтийг энэ хуудас батлахгүй." : "Booking confirmation and payment receipts are recorded separately. This page does not confirm email delivery."}</p>
      <dl className="grid gap-4 sm:grid-cols-2">{[
        [lang === "mn" ? "Дугаар" : "Reference", booking.ref], [lang === "mn" ? "Төлөв" : "Status", customerBookingStatusLabel(booking.status, lang)],
        [lang === "mn" ? "Өрөө, ор" : "Room and beds", `${booking.room_id} · ${booking.beds.join(", ")}`], [lang === "mn" ? "Байрлах огноо" : "Stay dates", `${booking.check_in} – ${booking.check_out}`],
        [lang === "mn" ? "Захиалгын дүн" : "Agreed total", formatMntAmount(booking.total)],
        [lang === "mn" ? "Үлдэгдэл" : "Remaining balance", booking.financials.remainingBalance === null ? (lang === "mn" ? "Хүлээн авалтаас тодруулах" : "Confirm with reception") : formatMntAmount(booking.financials.remainingBalance)],
      ].map(([label,value]) => <div key={label}><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-900">{value}</dd></div>)}</dl>
      {booking.status === "pending" && <p className="rounded-lg bg-amber-50 p-4 text-sm">{lang === "mn" ? "Ажилтны баталгаажуулалтыг хүлээнэ үү. Хүлээгдэж буй шилжүүлэг төлбөр хүлээн авсан гэсэн үг биш." : "Await staff confirmation. A pending bank transfer does not count as money received."}</p>}
      <BookingPaymentInstructions />
    </section>}
    <div className="flex flex-wrap gap-4"><Link href="/profile" className="min-h-11 rounded-lg bg-teal px-5 py-3 font-semibold text-white">{lang === "mn" ? "Миний захиалгууд" : "My Bookings"}</Link>{!booking && <Link href="/login?redirect=%2Fbooking%2Fconfirmation" className="min-h-11 py-3 text-teal underline">{lang === "mn" ? "Нэвтрэх" : "Sign in"}</Link>}<Link href="/contact" className="min-h-11 py-3 text-teal underline">{lang === "mn" ? "Хүлээн авалт" : "Reception"}</Link>{!loading && !needsLogin && <button onClick={() => setVersion(value => value + 1)} className="min-h-11 py-3 text-teal underline">{lang === "mn" ? "Дахин шалгах" : "Check again"}</button>}</div>
  </main>;
}
