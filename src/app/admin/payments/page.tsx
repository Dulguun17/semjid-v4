"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, Search } from "lucide-react";
import { workspaceAuthorizationHeaders } from "@/lib/workspace-api";
import { formatMntAmount } from "@/lib/payment-ledger";
import { ulaanbaatarToday } from "@/lib/bed-availability";
import { readReceptionPaymentAttempt, receptionPaymentStorageKey, type ReceptionPaymentRequest } from "@/lib/reception-payment";

type PaymentRecord = {
  id: string;
  booking_id: string;
  kind: "payment" | "refund";
  status: "pending" | "requested" | "completed" | "voided";
  amount: string | number;
  method: "cash" | "bank_transfer" | "online" | "other";
  received_on: string | null;
  reference: string | null;
  note: string | null;
  reason: string | null;
  created_by: string | null;
  verified_by: string | null;
  completed_by: string | null;
  created_at: string;
  completed_at: string | null;
};

type Booking = {
  id: string;
  ref: string;
  fname: string;
  lname: string;
  phone: string;
  room_id: string;
  check_in: string;
  check_out: string;
  booking_bed_assignments: { bed_id: string; released_at: string | null }[];
  total: number | string | null;
  status: string;
  created_at: string;
  payment_records: PaymentRecord[];
  financials: {
    agreedPrice: string;
    completedPayments: string;
    completedRefunds: string;
    netReceived: string;
    remainingBalance: string;
    overpayment: string;
    pendingPayments: string;
    requestedRefunds: string;
    paymentState: string;
  };
};

type CreateMode = "payment" | "refund";
type RecordAction = "complete_payment" | "complete_refund" | "void";

function stateLabel(state: string) {
  return ({
    unrecorded: "Төлбөрийн баримт бүртгээгүй",
    partial: "Хэсэгчлэн төлсөн",
    paid: "Төлөгдсөн",
    overpaid: "Илүү төлөлттэй",
    refunded: "Буцаан олголт хийсэн",
  } as Record<string, string>)[state] || state;
}

function entryLabel(record: PaymentRecord) {
  if (record.status === "pending") return "Баталгаажуулалт хүлээж байна";
  if (record.status === "requested") return "Буцаан олголт хүссэн";
  if (record.status === "voided") return "Хүчингүй болгосон";
  return record.kind === "refund" ? "Буцаан олгосон" : "Хүлээн авсан";
}

function methodLabel(method: PaymentRecord["method"]) {
  if (method === "cash") return "Бэлэн мөнгө";
  if (method === "bank_transfer") return "Банкны шилжүүлэг";
  if (method === "online") return "Онлайн — холбогдоогүй";
  return "Бусад";
}

function PaymentEntry({
  record,
  canManage,
  onAction,
}: {
  record: PaymentRecord;
  canManage: boolean;
  onAction: (id: string, action: RecordAction, reason: string, receivedOn: string) => Promise<void>;
}) {
  const [action, setAction] = useState<RecordAction | null>(null);
  const [reason, setReason] = useState("");
  const [receivedOn, setReceivedOn] = useState(ulaanbaatarToday());
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const needsManagerReason = action === "complete_refund" || action === "void";

  const submitAction = async () => {
    if (!action || (needsManagerReason && !reason.trim()) ||
      (action === "complete_payment" && !verified)) return;
    setSaving(true);
    setActionError("");
    try {
      await onAction(record.id, action, reason.trim(), receivedOn);
      setAction(null);
      setReason("");
      setVerified(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Бүртгэлийг өөрчилж чадсангүй.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-medium text-slate-800">
            {record.kind === "refund" ? "Буцаан олголт" : "Төлбөр"} · {methodLabel(record.method)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {entryLabel(record)}{record.received_on ? ` · Огноо: ${record.received_on}` : ""}
            {record.reference ? ` · Лавлагаа: ${record.reference}` : ""}
          </div>
          {record.note && <div className="mt-1 text-xs text-slate-600">{record.note}</div>}
          {record.reason && <div className="mt-1 text-xs text-slate-600">Шалтгаан: {record.reason}</div>}
          <div className="mt-1 text-[11px] text-slate-400">
            Бүртгэсэн ажилтан: {record.created_by || "Тодорхойгүй"}
            {record.verified_by ? ` · Баталгаажуулсан: ${record.verified_by}` : ""}
            {record.completed_by ? ` · Гүйцэтгэсэн: ${record.completed_by}` : ""}
          </div>
        </div>
        <strong className={record.kind === "refund" ? "text-rose-700" : "text-slate-900"}>
          {record.kind === "refund" ? "−" : "+"}{formatMntAmount(record.amount)}
        </strong>
      </div>

      {action === null && (
        <div className="mt-2 flex flex-wrap gap-2">
          {record.kind === "payment" && record.status === "pending" && (
            <button type="button" onClick={() => setAction("complete_payment")} className="text-xs font-medium text-teal-800 underline">
              Шилжүүлгийг баталгаажуулж төлөгдсөн болгох
            </button>
          )}
          {canManage && record.kind === "refund" && record.status === "requested" && (
            <button type="button" onClick={() => setAction("complete_refund")} className="text-xs font-medium text-teal-800 underline">
              Буцаан олголт хийснийг бүртгэх
            </button>
          )}
          {canManage && record.status !== "voided" && (
            <button type="button" onClick={() => setAction("void")} className="text-xs font-medium text-rose-700 underline">
              Засварын улмаас хүчингүй болгох
            </button>
          )}
        </div>
      )}

      {action && (
        <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
          {actionError && <p role="alert" className="text-xs text-red-700">{actionError}</p>}
          {action === "complete_payment" && (
            <>
              <label className="flex items-start gap-2 text-xs text-slate-700">
                <input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} />
                Банкны шилжүүлгийг бодитоор хүлээн авсныг шалгасан
              </label>
              <label className="block text-xs text-slate-600">
                Хүлээн авсан огноо
                <input type="date" value={receivedOn} onChange={event => setReceivedOn(event.target.value)} className="mt-1 block rounded border border-slate-200 px-2 py-1" />
              </label>
            </>
          )}
          {action === "complete_refund" && (
            <label className="block text-xs text-slate-600">
              Буцаан олгосон огноо
              <input type="date" value={receivedOn} onChange={event => setReceivedOn(event.target.value)} className="mt-1 block rounded border border-slate-200 px-2 py-1" />
            </label>
          )}
          {needsManagerReason && (
            <input
              value={reason}
              onChange={event => setReason(event.target.value)}
              required
              placeholder="Засвар/буцаан олголтын шалтгаан"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
          )}
          <div className="flex gap-2">
            <button type="button" disabled={saving || (needsManagerReason && !reason.trim()) || (action === "complete_payment" && !verified)} onClick={() => void submitAction()} className="rounded-lg bg-teal px-3 py-1.5 text-xs text-white disabled:opacity-50">
              {saving ? "Хадгалж байна…" : "Баталгаажуулах"}
            </button>
            <button type="button" disabled={saving} onClick={() => setAction(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">Болих</button>
          </div>
        </div>
      )}
    </li>
  );
}

function BookingPaymentCard({
  booking,
  canManage,
  onRefresh,
  openPayment = false,
  onRecorded,
}: {
  booking: Booking;
  canManage: boolean;
  onRefresh: () => Promise<void>;
  openPayment?: boolean;
  onRecorded: () => void;
}) {
  const [restored] = useState(() => {
    try {
      return { attempt: typeof window === "undefined" ? null : readReceptionPaymentAttempt(sessionStorage, booking.id), error: "" };
    } catch {
      return { attempt: null, error: "Өмнөх төлбөрийн хүсэлтийг сэргээж чадсангүй. Төлбөрийн түүхийг шалгуулна уу." };
    }
  });
  const [pendingRequest, setPendingRequest] = useState<ReceptionPaymentRequest | null>(restored.attempt);
  const [mode, setMode] = useState<CreateMode | null>(restored.attempt?.kind ?? (openPayment ? "payment" : null));
  const [amount, setAmount] = useState(restored.attempt?.amount ?? "");
  const [method, setMethod] = useState<"cash" | "bank_transfer">(restored.attempt?.method ?? "cash");
  const [receivedOn, setReceivedOn] = useState(restored.attempt?.received_on ?? ulaanbaatarToday());
  const [verified, setVerified] = useState(restored.attempt?.verified ?? false);
  const [reference, setReference] = useState(restored.attempt?.reference ?? "");
  const [note, setNote] = useState(restored.attempt?.note ?? "");
  const [reason, setReason] = useState(restored.attempt?.reason ?? "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || restored.error) return;
    if (!mode || !/^[1-9]\d*$/.test(amount)) {
      setFormError("Дүнг бүхэл төгрөгөөр оруулна уу.");
      return;
    }
    if (mode === "refund" && !reason.trim()) {
      setFormError("Буцаан олголтын шалтгаан шаардлагатай.");
      return;
    }
    if (mode === "payment" && method === "bank_transfer" && verified && !receivedOn) {
      setFormError("Хүлээн авсан огноо шаардлагатай.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const request: ReceptionPaymentRequest = pendingRequest ?? {
        booking_id: booking.id,
        kind: mode,
        amount,
        method,
        status: mode === "refund" ? "requested" : method === "cash" || verified ? "completed" : "pending",
        received_on: mode === "refund" || (method === "bank_transfer" && !verified) ? null : receivedOn,
        verified: mode === "payment" && method === "bank_transfer" && verified,
        reference: reference.trim() || null,
        note: mode === "payment" ? note.trim() || null : null,
        reason: mode === "refund" ? reason.trim() : null,
        idempotency_key: crypto.randomUUID(),
      };
      sessionStorage.setItem(receptionPaymentStorageKey(booking.id), JSON.stringify(request));
      setPendingRequest(request);
      const headers = { ...(await workspaceAuthorizationHeaders()), "Content-Type": "application/json" };
      const response = await fetch("/api/staff/payments", {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      });
      const result = await response.json();
      if (!response.ok) {
        if ([400, 401, 403, 404].includes(response.status)) {
          sessionStorage.removeItem(receptionPaymentStorageKey(booking.id));
          setPendingRequest(null);
        }
        throw new Error(result.error || "Төлбөрийн бүртгэл хадгалж чадсангүй.");
      }
      sessionStorage.removeItem(receptionPaymentStorageKey(booking.id));
      setPendingRequest(null);
      onRecorded();
      setMode(null);
      setAmount("");
      setReference("");
      setNote("");
      setReason("");
      setVerified(false);
      await onRefresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Төлбөрийн бүртгэл хадгалж чадсангүй.");
    } finally {
      setSaving(false);
    }
  };

  const onAction = async (id: string, action: RecordAction, actionReason: string, actionDate: string) => {
    const headers = { ...(await workspaceAuthorizationHeaders()), "Content-Type": "application/json" };
    const response = await fetch("/api/staff/payments", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        id,
        action,
        reason: actionReason,
        received_on: action === "complete_payment" || action === "complete_refund" ? actionDate : null,
        verified: action === "complete_payment",
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Бүртгэлийг өөрчилж чадсангүй.");
    await onRefresh();
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-slate-900">{booking.ref}</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">Захиалга: {booking.status}</span>
            <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal-800">{stateLabel(booking.financials.paymentState)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-700">{booking.fname} {booking.lname} · {booking.phone}</p>
          <p className="mt-1 text-sm text-slate-600">Өрөө {booking.room_id} · Ор {booking.booking_bed_assignments.filter(assignment => !assignment.released_at).map(assignment => assignment.bed_id).join(", ") || "—"}</p>
          <p className="mt-1 text-xs text-slate-500">{booking.check_in} — {booking.check_out}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={saving || !!pendingRequest || !!restored.error} onClick={() => { setMode("payment"); setFormError(""); }} className="rounded-lg bg-teal px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Төлбөр бүртгэх</button>
          <button type="button" onClick={() => { setMode("refund"); setFormError(""); }} disabled={saving || !!pendingRequest || !!restored.error || BigInt(booking.financials.netReceived) <= BigInt(0)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-40">Буцаалт хүсэх</button>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Тохирсон үнэ", booking.financials.agreedPrice],
          ["Төлбөрийн баримт", booking.financials.completedPayments],
          ["Хийсэн буцаалт", booking.financials.completedRefunds],
          ["Цэвэр хүлээн авсан", booking.financials.netReceived],
          ["Үлдэгдэл", booking.financials.remainingBalance],
          ["Илүү төлөлт", booking.financials.overpayment],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-50 p-3">
            <dt className="text-[11px] text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{formatMntAmount(value)}</dd>
          </div>
        ))}
      </dl>
      {(BigInt(booking.financials.pendingPayments) > BigInt(0) || BigInt(booking.financials.requestedRefunds) > BigInt(0)) && (
        <p className="mt-3 text-xs text-amber-800">
          Баталгаажаагүй төлбөр: {formatMntAmount(booking.financials.pendingPayments)} · Буцаалтын хүсэлт: {formatMntAmount(booking.financials.requestedRefunds)} — эдгээр нь цэвэр хүлээн авсан дүнд ороогүй.
        </p>
      )}

      {restored.error && <p role="alert" className="mt-4 text-sm text-red-700">{restored.error}</p>}
      {pendingRequest && <p role="status" className="mt-4 text-sm text-amber-800">Захиалга хадгалагдсан. Төлбөрийн хариу баталгаажаагүй бол ижил хүсэлтээр дахин оролдоно уу. Шинэ захиалга үүсгэх шаардлагагүй.</p>}
      {mode && (
        <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl border border-teal/20 bg-teal/5 p-4 sm:grid-cols-2">
          <h3 className="sm:col-span-2 text-sm font-semibold text-slate-800">{mode === "payment" ? "Хүлээн авсан төлбөр бүртгэх" : "Буцаан олголтын хүсэлт бүртгэх"}</h3>
          <fieldset disabled={saving || !!pendingRequest || !!restored.error} className="contents">
          <label className="text-xs text-slate-600">
            Дүн (₮)
            <input inputMode="numeric" pattern="[0-9]*" required value={amount} onChange={event => setAmount(event.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-slate-600">
            Арга
            <select value={method} onChange={event => setMethod(event.target.value as typeof method)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="cash">Бэлэн мөнгө</option>
              <option value="bank_transfer">Банкны шилжүүлэг</option>
            </select>
          </label>
          {mode === "payment" && (
            <label className="text-xs text-slate-600">
              Хүлээн авсан огноо
              <input type="date" required value={receivedOn} onChange={event => setReceivedOn(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
          )}
          {mode === "payment" && method === "bank_transfer" && (
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} />
              Шилжүүлгийг хүлээн авсныг шалгасан
            </label>
          )}
          <label className="text-xs text-slate-600">
            Лавлагаа (заавал биш)
            <input value={reference} onChange={event => setReference(event.target.value)} maxLength={200} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          {mode === "payment" ? (
            <label className="text-xs text-slate-600">
              Тэмдэглэл (заавал биш)
              <input value={note} onChange={event => setNote(event.target.value)} maxLength={500} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
          ) : (
            <label className="text-xs text-slate-600">
              Буцаалтын шалтгаан
              <input required value={reason} onChange={event => setReason(event.target.value)} maxLength={500} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
          )}
          {mode === "payment" && method === "bank_transfer" && !verified && (
            <p className="sm:col-span-2 text-xs text-amber-800">Баталгаажаагүй шилжүүлэг хүлээгдэж буй төлөвтэй хадгалагдана; хүлээн авсан төлбөрт тооцохгүй.</p>
          )}
          </fieldset>
          {formError && <p role="alert" className="sm:col-span-2 text-xs text-red-700">{formError}</p>}
          <div className="sm:col-span-2 flex gap-2">
            <button disabled={saving || !!restored.error || !amount || (mode === "refund" && !reason.trim())} className="rounded-lg bg-teal px-4 py-2 text-xs font-medium text-white disabled:opacity-50">{saving ? "Хадгалж байна…" : pendingRequest ? "Ижил хүсэлтээр дахин оролдох" : "Бүртгэх"}</button>
            <button type="button" disabled={saving || !!pendingRequest} onClick={() => setMode(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs">Болих</button>
          </div>
        </form>
      )}

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Төлбөрийн түүх</h3>
        {booking.payment_records.length ? (
          <ul className="space-y-2">
            {booking.payment_records.map(record => (
              <PaymentEntry key={record.id} record={record} canManage={canManage} onAction={onAction} />
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Төлбөрийн түүх бүртгэгдээгүй. Захиалгын үнэ нь хүлээн авсан мөнгөний нотолгоо биш.</p>
        )}
      </div>
    </article>
  );
}

export default function BookingPaymentsPage() {
  return <Suspense fallback={<p className="py-12 text-center">Ачаалж байна…</p>}><BookingPaymentsContent /></Suspense>;
}

function BookingPaymentsContent() {
  const params = useSearchParams();
  const selectedBookingId = params.get("bookingId");
  const openPayment = params.get("deposit") === "1";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recorded, setRecorded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/staff/payments", {
        headers: await workspaceAuthorizationHeaders(),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Төлбөрийн мэдээлэл ачаалж чадсангүй.");
      setBookings(result.bookings || []);
      setCanManage(result.can_manage === true);
    } catch (loadError) {
      console.error("Failed to load payment records", loadError);
      setError(loadError instanceof Error ? loadError.message : "Төлбөрийн мэдээлэл ачаалж чадсангүй.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = bookings.filter(booking => (!selectedBookingId || booking.id === selectedBookingId) &&
    [booking.ref, booking.fname, booking.lname, booking.phone]
      .some(value => value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Захиалгын төлбөрийн бүртгэл</h1>
        <p className="mt-1 text-sm text-slate-500">Захиалгын төлөвөөс тусдаа, ажилтны бүртгэсэн мөнгөн урсгалын түүх.</p>
      </header>
      {selectedBookingId && (
        <section role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>Хадгалсан захиалгын төлбөр. Өрөө, ор болон хүлээн авсан дүнг шалгаж урьдчилгааг бүртгэнэ үү.</p>
          <Link href="/admin/bookings/manage" className="mt-2 inline-block underline">Захиалгууд руу буцах</Link>
          <Link href="/admin/payments" className="ml-4 underline">Бүх төлбөр</Link>
        </section>
      )}
      {recorded && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">Төлбөрийн бүртгэл хадгалагдлаа. Доорх хүлээн авсан дүн, үлдэгдлийг шалгана уу.</p>}
      <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Онлайн төлбөр, QPay холбогдоогүй. QR эсвэл QPay үйлдэл энэ орчинд байхгүй. Баталгаажаагүй шилжүүлгийг мөнгө хүлээн авсанд тооцохгүй.
      </div>
      <label className="flex max-w-xl items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
        <Search size={16} className="text-slate-400" />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Захиалгын дугаар, нэр, утсаар хайх" className="w-full py-3 text-sm outline-none" />
      </label>
      {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => void load()} className="mt-2 underline">Мэдээллийг дахин ачаалах</button></div>}
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" /></div>
      ) : error ? null : filtered.length ? (
        <div className="space-y-4">
          {filtered.map(booking => (
            <BookingPaymentCard key={booking.id} booking={booking} canManage={canManage} onRefresh={load} openPayment={openPayment && booking.id === selectedBookingId && booking.payment_records.length === 0} onRecorded={() => setRecorded(true)} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          <CreditCard className="mx-auto mb-2 text-slate-300" />
          Захиалгын бүртгэл олдсонгүй.
        </div>
      )}
    </div>
  );
}
