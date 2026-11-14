"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { workspaceAuthorizationHeaders, workspaceSession } from "@/lib/workspace-api";
import { bookingConfirmationStorageKey, customerBookingErrorMessage, customerBookingStatusLabel, type CustomerBedSelection, type CustomerBookingQuote } from "@/lib/customer-booking";
import { formatMntAmount } from "@/lib/payment-ledger";
import { BookingPaymentInstructions } from "@/components/ui/BookingPaymentInstructions";
import { supabase } from "@/lib/supabase";
import { BookingSteps } from "@/components/ui/BookingSteps";

type BookingRequest = CustomerBedSelection & { ownerId: string; firstName: string; lastName: string; phone: string; payment: "cash" | "bank"; requestId: string; expectedTotal: string };

export function CustomerBookingSummary({ selection }: { selection: CustomerBedSelection }) {
  const { lang } = useLang();
  const router = useRouter();
  const [quote, setQuote] = useState<CustomerBookingQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", payment: "cash" as "cash" | "bank" });
  const [pending, setPending] = useState<BookingRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ ref: string; status: string; total: string | number } | null>(null);
  const selectionKey = JSON.stringify(selection);
  const storageKey = `semjid:online-booking:${selectionKey}`;
  const query = new URLSearchParams({ roomId: selection.roomId, checkIn: selection.checkIn, checkOut: selection.checkOut, gender: selection.gender, bedIds: selection.bedIds.join(",") });

  const loadQuote = async () => {
    setLoading(true);
    setError("");
    let signedIn = false;
    let status = 503;
    try {
      const headers = await workspaceAuthorizationHeaders();
      signedIn = true;
      setNeedsLogin(false);
      const response = await fetch("/api/customer/booking-summary", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: selectionKey });
      const result = await response.json();
      status = response.status;
      if (response.status === 401) setNeedsLogin(true);
      setAccessDenied(response.status === 403);
      if (!response.ok || !result.quote) throw new Error("Quote unavailable");
      setQuote(result.quote);
    } catch {
      setNeedsLogin(!signedIn || status === 401);
      setError(customerBookingErrorMessage(signedIn ? status : 401, lang));
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    let expectedUserId: string | null = null;
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (expectedUserId && session?.user.id !== expectedUserId)) {
        active = false;
        setPending(null);
        setSaved(null);
        setQuote(null);
        setCustomerId(null);
        setAccessDenied(false);
        setForm({ firstName: "", lastName: "", phone: "", payment: "cash" });
        setNeedsLogin(true);
        setLoading(false);
      }
    });
    const initialise = async () => {
      let signedIn = false;
      let status = 503;
      try {
        const session = await workspaceSession();
        expectedUserId = session.user.id;
        signedIn = true;
        const headers = { Authorization: `Bearer ${session.access_token}` };
        if (!active) return;
        const { data: role, error: roleError } = await supabase.rpc("get_workspace_role");
        if (!active) return;
        if (roleError) throw roleError;
        if (role !== "customer") {
          setAccessDenied(true);
          setNeedsLogin(false);
          setQuote(null);
          return;
        }
        setAccessDenied(false);
        setNeedsLogin(false);
        const details = sessionStorage.getItem(`semjid:booking-details:${session.user.id}`);
        if (details) {
          const draft = JSON.parse(details);
          if ([draft.firstName, draft.lastName, draft.phone].every(value => typeof value === "string") && ["cash", "bank"].includes(draft.payment)) setForm({ firstName: draft.firstName, lastName: draft.lastName, phone: draft.phone, payment: draft.payment });
        }
        const raw = sessionStorage.getItem(`${storageKey}:${session.user.id}`);
        if (raw) {
          const request = JSON.parse(raw) as BookingRequest;
          if (request.ownerId !== session.user.id || JSON.stringify({ roomId: request.roomId, checkIn: request.checkIn, checkOut: request.checkOut, bedIds: request.bedIds, gender: request.gender }) !== selectionKey) throw new Error("Pending request mismatch");
          setPending(request);
          setForm({ firstName: request.firstName, lastName: request.lastName, phone: request.phone, payment: request.payment });
        }
        setCustomerId(session.user.id);
        const response = await fetch("/api/customer/booking-summary", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: selectionKey });
        const result = await response.json();
        status = response.status;
        if (!active) return;
        setAccessDenied(response.status === 403);
        if (!response.ok || !result.quote) throw new Error("Summary unavailable");
        setQuote(result.quote);
      } catch {
        if (active) {
          setError(customerBookingErrorMessage(signedIn ? status : 401, lang));
          setNeedsLogin(!signedIn || status === 401);
        }
      } finally { if (active) setLoading(false); }
    };
    void initialise();
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [selectionKey, storageKey, lang]);

  useEffect(() => {
    if (!customerId) return;
    try { sessionStorage.setItem(`semjid:booking-details:${customerId}`, JSON.stringify(form)); }
    catch { /* Request submission still requires its own durable retry record. */ }
  }, [customerId, form]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if ((!quote && !pending) || saving || accessDenied || (loading && !pending)) return;
    setSaving(true);
    setError("");
    try {
      const session = await workspaceSession();
      if (pending && pending.ownerId !== session.user.id) throw new Error("Account changed");
      const attemptKey = `${storageKey}:${session.user.id}`;
      const request: BookingRequest = pending ?? { ...selection, ...form, ownerId: session.user.id, expectedTotal: quote!.total, requestId: crypto.randomUUID() };
      sessionStorage.setItem(attemptKey, JSON.stringify(request));
      setPending(request);
      const response = await fetch("/api/booking", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify(request) });
      const result = await response.json();
      if (!response.ok || !result.booking) {
        if ([400, 401, 403, 410].includes(response.status) || result.code === "availability_conflict") {
          sessionStorage.removeItem(attemptKey);
          setPending(null);
          setQuote(null);
        }
        setNeedsLogin(response.status === 401);
        setAccessDenied(response.status === 403);
        setError(customerBookingErrorMessage(response.status, lang));
        return;
      }
      const currentSession = await workspaceSession();
      if (currentSession.user.id !== session.user.id) throw new Error("Account changed");
      if (typeof result.booking.id !== "string" || !result.booking.id) throw new Error("Saved booking ID missing");
      sessionStorage.setItem(bookingConfirmationStorageKey(session.user.id), result.booking.id);
      setSaved(result.booking);
      sessionStorage.removeItem(attemptKey);
      setPending(null);
      router.replace("/booking/confirmation");
    } catch {
      setError(lang === "mn" ? "Хадгалсан эсэх баталгаажаагүй. Миний захиалгуудыг шалгах эсвэл ижил хүсэлтээр дахин оролдоно уу." : "Saving could not be confirmed. Check My Bookings or retry the same request.");
    } finally { setSaving(false); }
  };

  const total = saved ? String(saved.total) : quote?.total ?? pending?.expectedTotal ?? null;

  return (
    <main className="min-h-[70vh] bg-[#f6f5f1] px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <BookingSteps activeStep={4} />
        <header className="space-y-3">
          <h1 className="font-serif text-3xl text-slate-900 sm:text-4xl">{lang === "mn" ? "Захиалгаа шалгах" : "Review your stay"}</h1>
          <p className="text-base leading-7 text-slate-600">{lang === "mn" ? "Өрөө, ор, огноо болон нийт үнийг шалгаад мэдээллээ оруулна уу. Хадгалсан хүсэлт Миний захиалгууд хэсэгт харагдана." : "Check the room, beds, dates and total, then enter your details. Saved requests appear in My Bookings."}</p>
        </header>

        {accessDenied && (
          <section role="status" className="rounded-2xl border border-teal/20 bg-white p-6">
            <h2 className="text-xl font-semibold">{lang === "mn" ? "Хэрэглэгчийн бүртгэл шаардлагатай" : "Use a customer account"}</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">{customerBookingErrorMessage(403, lang)}</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <Link href="/admin" className="rounded-lg bg-teal px-5 py-3 font-medium text-white">{lang === "mn" ? "Ажлын самбар нээх" : "Open workspace"}</Link>
              <Link href={`/login?redirect=${encodeURIComponent(`/booking/summary?${query}`)}`} className="px-2 py-3 font-semibold text-teal underline">{lang === "mn" ? "Хэрэглэгчээр нэвтрэх" : "Sign in as a customer"}</Link>
            </div>
          </section>
        )}

        {saved && (
          <section role="status" className={`rounded-2xl border p-6 ${saved.status === "cancelled" || saved.status === "no_show" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
            <p className="text-sm text-slate-600">{lang === "mn" ? "Захиалгын дугаар" : "Booking reference"}</p>
            <h2 className="mt-1 break-words font-mono text-2xl font-bold text-slate-900">{saved.ref}</h2>
            <p className="mt-3 text-base">{lang === "mn" ? "Төлөв" : "Status"} · <strong>{customerBookingStatusLabel(saved.status, lang)}</strong></p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{saved.status === "pending"
              ? (lang === "mn" ? "Хүсэлт хадгалагдлаа. Ажилтны баталгаажуулалтыг хүлээнэ үү. Төлбөрийн баримт тусдаа бүртгэгдэнэ." : "Request saved. Await staff confirmation. Payment receipts are recorded separately.")
              : (lang === "mn" ? "Одоогийн төлөв, төлбөрийн мэдээллээ Миний захиалгууд хэсгээс харна уу." : "See My Bookings for the current status and payment totals.")}</p>
            <Link href="/profile" className="mt-4 inline-flex min-h-12 items-center rounded-lg bg-teal px-5 py-3 font-semibold text-white">{lang === "mn" ? "Миний захиалгууд" : "My Bookings"}</Link>
          </section>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <section aria-labelledby="stay-summary-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <h2 id="stay-summary-heading" className="text-xl font-semibold text-slate-900">{lang === "mn" ? "Таны байрлах мэдээлэл" : "Your stay"}</h2>
              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <div><dt className="text-sm text-slate-600">{lang === "mn" ? "Ирэх өдөр" : "Check-in"}</dt><dd className="mt-1 text-lg font-semibold">{selection.checkIn}</dd></div>
                <div><dt className="text-sm text-slate-600">{lang === "mn" ? "Гарах өдөр" : "Check-out"}</dt><dd className="mt-1 text-lg font-semibold">{selection.checkOut}</dd></div>
                <div><dt className="text-sm text-slate-600">{lang === "mn" ? "Өрөө" : "Room"}</dt><dd className="mt-1 text-lg font-semibold">{selection.roomId}</dd></div>
                <div><dt className="text-sm text-slate-600">{lang === "mn" ? "Сонгосон ор" : "Selected beds"}</dt><dd className="mt-1 text-lg font-semibold">{selection.bedIds.join(", ")}</dd></div>
                <div><dt className="text-sm text-slate-600">{lang === "mn" ? "Насанд хүрсэн зочид" : "Adult guests"}</dt><dd className="mt-1 text-lg font-semibold">{selection.bedIds.length}</dd></div>
              </dl>
              {!saved && !pending && <Link href="/booking" className="mt-5 inline-block min-h-11 py-3 font-semibold text-teal underline">← {lang === "mn" ? "Өрөө, ор руу буцах" : "Back to room & beds"}</Link>}
            </section>

            {!saved && !accessDenied && (
              <section aria-labelledby="guest-details-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                <h2 id="guest-details-heading" className="text-xl font-semibold text-slate-900">{lang === "mn" ? "Зочны мэдээлэл" : "Guest details"}</h2>
                {loading && <p role="status" className="mt-4 text-slate-600">{lang === "mn" ? "Үнийн санал шалгаж байна…" : "Verifying summary…"}</p>}
                {error && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">{error}</p>}
                {needsLogin && <Link href={`/login?redirect=${encodeURIComponent(`/booking/summary?${query}`)}`} className="mt-4 inline-block min-h-12 rounded-lg bg-teal px-5 py-3 font-semibold text-white">{lang === "mn" ? "Хэрэглэгчээр нэвтрэх" : "Sign in"}</Link>}
                {!loading && !pending && <button type="button" onClick={() => void loadQuote()} className="mt-4 min-h-11 font-semibold text-teal underline">{lang === "mn" ? "Үнийн саналыг дахин шалгах" : "Refresh summary"}</button>}
                {(quote || pending) && (
                  <form onSubmit={submit} className="mt-5 space-y-5">
                    <fieldset disabled={saving || !!pending} className="grid gap-4 sm:grid-cols-2">
                      {([
                        ['firstName', lang === "mn" ? "Нэр" : "First name"],
                        ['lastName', lang === "mn" ? "Овог" : "Last name"],
                        ['phone', lang === "mn" ? "Утас" : "Phone"],
                      ] as const).map(([key, label]) => (
                        <label key={key} className="text-sm font-medium text-slate-700">
                          {label}
                          <input required maxLength={key === "phone" ? 30 : 100} type={key === "phone" ? "tel" : "text"}
                            autoComplete={key === "firstName" ? "given-name" : key === "lastName" ? "family-name" : "tel"}
                            value={form[key]} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))}
                            className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-base disabled:bg-slate-50" />
                        </label>
                      ))}
                      <fieldset className="rounded-2xl border border-teal/20 bg-[#f0f7f5] p-5 sm:col-span-2">
                        <legend className="px-2 text-xl font-semibold text-slate-900">{lang === "mn" ? "Төлбөрөө төлөвлөх" : "Plan your payment"}</legend>
                        <p className="mb-4 text-sm leading-6 text-slate-700">{lang === "mn" ? "Төлөхөөр төлөвлөсөн хэлбэрээ сонгоно уу. Ажилтан төлбөрийг тусад нь бүртгэнэ." : "Choose your planned payment method. Staff record payments separately."}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {(["cash", "bank"] as const).map(method => (
                            <label key={method} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${form.payment === method ? "border-teal bg-white ring-1 ring-teal" : "border-slate-200 bg-white"}`}>
                              <input type="radio" name="payment" value={method} checked={form.payment === method} onChange={() => setForm(current => ({ ...current, payment: method }))} className="mt-1 h-5 w-5 shrink-0 accent-teal" />
                              <span>
                                <span className="block text-base font-semibold text-slate-900">{method === "cash" ? (lang === "mn" ? "Хүлээн авалтад бэлэн" : "Cash at reception") : (lang === "mn" ? "Банкны шилжүүлэг" : "Bank transfer")}</span>
                                <span className="mt-2 block text-sm leading-6 text-slate-600">{method === "cash" ? (lang === "mn" ? "Хүлээн авалтад төлнө. Ажилтан хүлээн авсан дүнг бүртгэнэ." : "Pay reception. Staff record the amount received.") : (lang === "mn" ? "Дансны мэдээллийг хүлээн авалтаас авна. Ажилтан шалгах хүртэл шилжүүлэг хүлээгдэнэ." : "Get bank details from reception. Transfers remain pending until staff manually verify receipt.")}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-700">{lang === "mn" ? "Бэлэн болон шилжүүлгийн хэсэгчилсэн төлбөрийг ажилтан бүртгэж болно. Хүлээгдэж буй шилжүүлэг хүлээн авсан төлбөрт тооцогдохгүй." : "Staff can record split cash and bank payments. Pending transfers do not count as money received."}</p>
                      </fieldset>
                    </fieldset>
                    <p className="text-sm leading-6 text-slate-600">{lang === "mn" ? "Хадгалах үед үнэ, хүртээмжийг дахин шалгана. Хүсэлт хадгалах нь мөнгө хүлээн авсан гэж бүртгэхгүй." : "Price and availability are checked again when saving. Submitting a request does not record money received."}</p>
                    {pending && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm leading-6">{lang === "mn" ? "Өмнөх хүсэлтийн хариу баталгаажаагүй. Ижил хүсэлтээр дахин оролдох эсвэл Миний захиалгуудыг шалгана уу." : "The previous response is unconfirmed. Retry the same request or check My Bookings."}</p>}
                    {!pending && !quote?.canSave && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm">{lang === "mn" ? "Онлайн хадгалалт энэ орчинд хараахан нээгдээгүй." : "Online saving is not enabled in this environment yet."}</p>}
                    <button disabled={saving || (loading && !pending) || (!pending && !quote?.canSave)} className="min-h-12 w-full rounded-lg bg-teal px-5 py-3 text-base font-semibold text-white disabled:opacity-50">
                      {saving ? (lang === "mn" ? "Хадгалж байна…" : "Saving…") : pending ? (lang === "mn" ? "Ижил хүсэлтээр дахин оролдох" : "Retry same request") : (lang === "mn" ? "Хүсэлт хадгалах" : "Save request")}
                    </button>
                  </form>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <section aria-labelledby="price-summary-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <h2 id="price-summary-heading" className="text-xl font-semibold text-slate-900">{lang === "mn" ? "Нийт үнэ" : "Total price"}</h2>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{total === null ? "—" : formatMntAmount(total)}</p>
              {quote && <p className="mt-3 text-sm leading-6 text-slate-600">{formatMntAmount(quote.nightlyRate)} × {quote.guests} {lang === "mn" ? "насанд хүрэгч" : "adult(s)"} × {quote.nights} {lang === "mn" ? "шөнө" : "nights"}</p>}
              <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">{lang === "mn" ? "Одоогийн насанд хүрэгчдийн өрөөний үнээр тооцов. Хүүхэд, хоол, эмчилгээ болон тусгай багцад багтах зүйлсийг хүлээн авалтаас тодруулна уу." : "Uses the current adult room rate. Confirm child rates, meals, treatments and package inclusions with reception."}</p>
            </section>
            <BookingPaymentInstructions />
          </aside>
        </div>
        <div className="flex flex-wrap gap-5 text-sm font-semibold">
          <Link href="/profile" className="min-h-11 py-3 text-teal underline">{lang === "mn" ? "Миний захиалгууд" : "My Bookings"}</Link>
          {saved && <Link href="/booking" className="min-h-11 py-3 text-teal underline">{lang === "mn" ? "Өөр хүсэлт эхлүүлэх" : "Start another request"}</Link>}
        </div>
      </div>
    </main>
  );
}
