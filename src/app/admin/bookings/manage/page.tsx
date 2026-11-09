"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { formatMNT } from "@/lib/data";
import { addUtcDays, BOOKING_STAY_NIGHTS, validateBookingDates } from "@/lib/booking-rules";
import { hasSameGenderSharingConflict, ulaanbaatarToday } from "@/lib/bed-availability";
import { workspaceAuthorizationHeaders } from "@/lib/workspace-api";

type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
type Booking = {
  id: string;
  ref: string;
  fname: string;
  lname: string;
  phone: string;
  email: string | null;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: BookingStatus;
  total: number;
  payment: string;
  source: string | null;
  created_at: string;
  cancellation_reason: string | null;
  bed_allocation_required: boolean;
  bed_gender_review_required: boolean;
  actual_check_in_at: string | null;
  actual_check_out_at: string | null;
  bed_assignments: BedAssignment[];
};
type BedAssignment = {
  id?: number;
  bed_id: string;
  guest_gender: "female" | "male" | "unknown";
  released_at?: string | null;
};
type RoomUnit = {
  id: string;
  category_id: string;
  category: { capacity: number; adult1: number | null; adult2: number | null } | null;
  beds: { id: string; bed_number: number }[];
};
type BookingForm = {
  fname: string;
  lname: string;
  phone: string;
  email: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: string;
  notes: string;
  status: BookingStatus;
  source: "phone" | "walk_in";
  payment: "cash" | "bank" | "qpay" | "card";
  adjust_price: boolean;
  price_adjustment_reason: string;
  cancellation_reason: string;
  bed_assignments: BedAssignment[];
};
type Availability = "unknown" | "checking" | "available" | "full" | "closed";
type BookingLists = { bookings: Booking[]; arrivals: Booking[]; departures: Booking[]; currentGuests: Booking[]; can_manage: boolean };
type BookingPolicy = { stay_nights: number; advance_months: number };

const statuses: BookingStatus[] = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];
const activeStatuses: BookingStatus[] = ["pending", "confirmed", "checked_in"];
const statusNames: Record<BookingStatus, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  checked_in: "Байрлаж буй",
  checked_out: "Гарсан",
  cancelled: "Цуцлагдсан",
  no_show: "Ирээгүй",
};

function todayIso() {
  return ulaanbaatarToday();
}

function emptyForm(guestCount = 1): BookingForm {
  const check_in = todayIso();
  return {
    fname: "", lname: "", phone: "", email: "", room_id: "",
    check_in, check_out: addUtcDays(check_in, 7), guests: "1",
    notes: "", status: "pending", source: "phone", payment: "cash",
    adjust_price: false, price_adjustment_reason: "", cancellation_reason: "",
    bed_assignments: Array.from({ length: guestCount }, () => ({ bed_id: "", guest_gender: "unknown" })),
  };
}

function roomLabel(room: RoomUnit) {
  return `${room.id} · ${room.category_id} · ${room.category?.capacity ?? "?"} ор`;
}

function availabilityMessage(state: Availability) {
  if (state === "checking") return "Хүртээмж шалгаж байна…";
  if (state === "available") return "Сонгосон хугацаанд тус бүрд нь сонгох боломжтой ор байна.";
  if (state === "full") return "Сонгосон хугацаанд сонгосон орны тоо хүрэлцэхгүй.";
  if (state === "closed") return "Энэ өрөө сонгосон хугацаанд хаалттай.";
  return "Хүртээмж тодорхойгүй. Захиалгыг хадгалахын өмнө амжилттай шалгах шаардлагатай.";
}

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [arrivals, setArrivals] = useState<Booking[]>([]);
  const [departures, setDepartures] = useState<Booking[]>([]);
  const [currentGuests, setCurrentGuests] = useState<Booking[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [rooms, setRooms] = useState<RoomUnit[]>([]);
  const [policy, setPolicy] = useState<BookingPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedBooking, setSavedBooking] = useState<{ id: string; ref: string; room: string; beds: string[] } | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [availability, setAvailability] = useState<Availability>("unknown");
  const [availableBeds, setAvailableBeds] = useState<{ bed_id: string; label: string; bed_number: number }[]>([]);
  const [genderConflict, setGenderConflict] = useState(false);
  const [allocationRequired, setAllocationRequired] = useState(false);
  const [genderAssignmentConflict, setGenderAssignmentConflict] = useState(false);

  const load = useCallback(async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const headers = await workspaceAuthorizationHeaders();
      const [bookingResponse, roomResponse] = await Promise.all([
        fetch(`/api/staff/bookings?q=${encodeURIComponent(query)}`, { headers }),
        fetch("/api/staff/rooms", { headers }),
      ]);
      const [bookingData, roomData] = await Promise.all([bookingResponse.json(), roomResponse.json()]);
      if (!bookingResponse.ok) throw new Error(bookingData.error || "Захиалгуудыг ачаалж чадсангүй.");
      if (!roomResponse.ok) throw new Error(roomData.error || "Өрөөний жагсаалтыг ачаалж чадсангүй.");
      const data = bookingData as BookingLists;
      setCanManage(data.can_manage === true);
      setBookings(data.bookings);
      setArrivals(data.arrivals);
      setDepartures(data.departures);
      setCurrentGuests(data.currentGuests);
      setRooms(roomData.rooms || []);
      if (!roomData.policy ||
        !Number.isInteger(roomData.policy.stay_nights) ||
        !Number.isInteger(roomData.policy.advance_months)) {
        throw new Error("Захиалгын огнооны дүрэм ачаалж чадсангүй.");
      }
      setPolicy(roomData.policy);
      setBookings(data.bookings);
    } catch (loadError) {
      console.error("Failed to load staff booking workspace", loadError);
      setError(loadError instanceof Error ? loadError.message : "Мэдээлэл ачаалж чадсангүй.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const formNeedsAvailability = useMemo(() => {
    if (!editing) return true;
    const changedCapacityInputs =
      form.room_id !== editing.room_id ||
      form.check_in !== editing.check_in ||
      form.check_out !== editing.check_out ||
      Number(form.guests) !== editing.guests;
    const becomingActive = !activeStatuses.includes(editing.status) && activeStatuses.includes(form.status);
    const oldAssignments = (editing.bed_assignments || []).filter(assignment => !assignment.released_at)
      .map(({ bed_id, guest_gender }) => ({ bed_id, guest_gender }));
    const selectedAssignments = form.bed_assignments.filter(assignment => assignment.bed_id);
    const assignmentsChanged = JSON.stringify(oldAssignments) !== JSON.stringify(selectedAssignments);
    return changedCapacityInputs || becomingActive || assignmentsChanged || editing.bed_allocation_required;
  }, [editing, form]);

  useEffect(() => {
    if (!showForm) return;
    if (!formNeedsAvailability) {
      setAvailability("available");
      setAvailableBeds((rooms.find(room => room.id === form.room_id)?.beds || []).map(bed => ({
        bed_id: bed.id, label: bed.id, bed_number: bed.bed_number,
      })));
      setGenderConflict(false);
      setAllocationRequired(false);
      return;
    }
    if (!form.room_id) {
      setAvailability("unknown");
      setAvailableBeds([]);
      return;
    }
    if (!policy) {
      setAvailability("unknown");
      setAvailableBeds([]);
      return;
    }
    const datesChanged = !editing || form.check_in !== editing.check_in || form.check_out !== editing.check_out;
    const dateError = datesChanged
      ? validateBookingDates(form.check_in, form.check_out, ulaanbaatarToday(), policy.stay_nights, policy.advance_months)
      : null;
    if (dateError) {
      setAvailability("unknown");
      return;
    }
    const hasInvalidGroupGender = hasSameGenderSharingConflict(
      [],
      form.bed_assignments.map(assignment => assignment.guest_gender)
    );
    if (hasInvalidGroupGender) {
      setAvailability("full");
      setAvailableBeds([]);
      setGenderConflict(false);
      setGenderAssignmentConflict(true);
      return;
    }
    setGenderAssignmentConflict(false);

    let active = true;
    const controller = new AbortController();
    setAvailability("checking");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const headers = await workspaceAuthorizationHeaders();
          const params = new URLSearchParams({
            roomId: form.room_id,
            checkin: form.check_in,
            checkout: form.check_out,
            genders: JSON.stringify(form.bed_assignments.map(assignment => assignment.guest_gender)),
          });
          if (editing) params.set("bookingId", editing.id);
          const response = await fetch(`/api/availability?${params}`, { headers, signal: controller.signal });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Availability check failed.");
          if (active) {
            setAvailableBeds(result.available_beds || []);
            setGenderConflict(!!result.gender_conflict);
            setAllocationRequired(!!result.allocation_required);
            const assignedBedIds = form.bed_assignments.map(assignment => assignment.bed_id).filter(Boolean);
            const availableIds = new Set((result.available_beds || []).map((bed: { bed_id: string }) => bed.bed_id));
            const assignmentsStillFree = assignedBedIds.every(id => availableIds.has(id));
            setAvailability(result.blocked ? "closed"
              : result.allocation_required || result.gender_conflict || !result.available || !assignmentsStillFree
                ? "full" : "available");
          }
        } catch (availabilityError) {
          if (!controller.signal.aborted) {
            console.error("Room availability is unknown", availabilityError);
            if (active) {
              setAvailability("unknown");
              setAvailableBeds([]);
            }
          }
        }
      })();
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [editing, form.bed_assignments, form.check_in, form.check_out, form.guests, form.room_id, form.status, formNeedsAvailability, policy, rooms, showForm]);

  const visibleBookings = bookings.filter(booking => filter === "all" || booking.status === filter);
  const selectedRoom = rooms.find(room => room.id === form.room_id);
  const nightlyRate = selectedRoom?.category?.adult1 ?? selectedRoom?.category?.adult2 ?? null;
  const stayNights = policy?.stay_nights ?? BOOKING_STAY_NIGHTS;
  const estimatedTotal = nightlyRate === null ? null : nightlyRate * Number(form.guests) * stayNights;
  const changedDates = !editing || form.check_in !== editing.check_in || form.check_out !== editing.check_out;
  const dateError = changedDates && policy
    ? validateBookingDates(form.check_in, form.check_out, ulaanbaatarToday(), policy.stay_nights, policy.advance_months)
    : changedDates ? "booking_policy_unknown" : null;
  const selectedBedIds = form.bed_assignments.map(assignment => assignment.bed_id);
  const allBedsSelected = form.bed_assignments.length === Number(form.guests) &&
    form.bed_assignments.every(assignment => !!assignment.bed_id) &&
    new Set(selectedBedIds).size === selectedBedIds.length;
  const canSave = !saving && !!policy && (availability === "available") &&
    !hasSameGenderSharingConflict([], form.bed_assignments.map(assignment => assignment.guest_gender)) &&
    (!activeStatuses.includes(form.status) || allBedsSelected) && !dateError &&
    (!form.adjust_price || form.price_adjustment_reason.trim().length > 0) &&
    (form.status !== "cancelled" || !editing || !!form.cancellation_reason.trim() || !!editing.cancellation_reason);

  const beginCreate = () => {
    if (!policy) {
      setError("Захиалгын дүрэм ачаалагдаагүй тул захиалга бүртгэх боломжгүй.");
      return;
    }
    setEditing(null);
    const nextForm = emptyForm();
    nextForm.check_out = addUtcDays(nextForm.check_in, policy.stay_nights);
    setForm(nextForm);
    setAvailability("unknown");
    setError("");
    setShowForm(true);
  };

  const beginEdit = (booking: Booking) => {
    setEditing(booking);
    const assignedBeds = (booking.bed_assignments || [])
      .filter(assignment => !assignment.released_at)
      .map(assignment => ({ bed_id: assignment.bed_id, guest_gender: assignment.guest_gender }));
    setForm({
      fname: booking.fname,
      lname: booking.lname,
      phone: booking.phone,
      email: booking.email || "",
      room_id: booking.room_id,
      check_in: booking.check_in,
      check_out: booking.check_out,
      guests: String(booking.guests),
      notes: "",
      status: booking.status,
      source: booking.source === "walk_in" ? "walk_in" : "phone",
      payment: (["cash", "bank", "qpay", "card"].includes(booking.payment) ? booking.payment : "cash") as BookingForm["payment"],
      adjust_price: false,
      price_adjustment_reason: "",
      cancellation_reason: booking.cancellation_reason || "",
      bed_assignments: assignedBeds.length > 0
        ? assignedBeds
        : Array.from({ length: booking.guests }, () => ({ bed_id: "", guest_gender: "unknown" as const })),
    });
    setAvailability("unknown");
    setError("");
    setShowForm(true);
  };

  const setField = <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => {
    setForm(previous => {
      const next = { ...previous, [key]: value };
      if (key === "check_in" && typeof value === "string" && value) {
        next.check_out = addUtcDays(value, policy?.stay_nights ?? BOOKING_STAY_NIGHTS);
      }
      if (key === "guests" && typeof value === "string") {
        const count = Math.max(0, Math.min(20, Number.parseInt(value, 10) || 0));
        next.bed_assignments = Array.from({ length: count }, (_, index) =>
          previous.bed_assignments[index] || { bed_id: "", guest_gender: "unknown" }
        );
      }
      return next;
    });
  };

  const setGuestBedAssignment = (index: number, patch: Partial<BedAssignment>) => {
    setForm(previous => ({
      ...previous,
      bed_assignments: previous.bed_assignments.map((assignment, assignmentIndex) =>
        assignmentIndex === index ? { ...assignment, ...patch } : assignment
      ),
    }));
  };

  const saveBooking = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const headers = { ...(await workspaceAuthorizationHeaders()), "Content-Type": "application/json" };
      const payload: Record<string, unknown> = {
        fname: form.fname.trim(),
        lname: form.lname.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        room_id: form.room_id,
        guests: Number(form.guests),
        status: form.status,
      };
      if (!editing || form.check_in !== editing.check_in || form.check_out !== editing.check_out) {
        payload.check_in = form.check_in;
        payload.check_out = form.check_out;
      }
      const oldAssignments = (editing?.bed_assignments || []).filter(assignment => !assignment.released_at)
        .map(({ bed_id, guest_gender }) => ({ bed_id, guest_gender }));
      const selectedAssignments = form.bed_assignments.filter(assignment => assignment.bed_id);
      if (!editing || (activeStatuses.includes(form.status) &&
        (editing.bed_allocation_required || JSON.stringify(oldAssignments) !== JSON.stringify(selectedAssignments)))) {
        payload.bed_assignments = form.bed_assignments;
      }
      if (!editing) {
        payload.source = form.source;
        payload.payment = form.payment;
        payload.notes = form.notes.trim();
      }
      if (editing && form.adjust_price) {
        payload.adjust_price = true;
        payload.price_adjustment_reason = form.price_adjustment_reason.trim();
      }
      if (form.status === "cancelled" && form.cancellation_reason.trim()) {
        payload.cancellation_reason = form.cancellation_reason.trim();
      }

      const response = await fetch("/api/staff/bookings", {
        method: editing ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Захиалгыг хадгалж чадсангүй.");
      if (!editing && result.booking?.id) {
        setSavedBooking({
          id: result.booking.id,
          ref: result.booking.ref,
          room: result.booking.room_id,
          beds: form.bed_assignments.map(assignment => assignment.bed_id).filter(Boolean),
        });
      }
      setShowForm(false);
      setEditing(null);
      await load(search);
    } catch (saveError) {
      console.error("Failed to save staff booking", saveError);
      setError(saveError instanceof Error ? saveError.message : "Захиалгыг хадгалж чадсангүй.");
    } finally {
      setSaving(false);
    }
  };

  const searchBookings = (value: string) => {
    setSearch(value);
    void load(value);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Захиалгууд</h1>
          <p className="mt-1 text-sm text-slate-500">Утас болон биечлэн ирсэн захиалгыг удирдана. Цахим захиалга хаалттай хэвээр.</p>
        </div>
        <button onClick={beginCreate} disabled={!policy || loading} className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50">
          <Plus size={16} /> Захиалга бүртгэх
        </button>
      </header>

      {savedBooking && (
        <section role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Захиалга хадгалагдлаа · {savedBooking.ref}</p>
          <p className="mt-1">Өрөө {savedBooking.room} · Ор {savedBooking.beds.join(", ")}</p>
          <p className="mt-1">Урьдчилгаа төлбөрийг дараагийн алхамд бүртгэнэ. Энэ захиалгыг дахин үүсгэх шаардлагагүй.</p>
          <Link href={`/admin/payments?bookingId=${encodeURIComponent(savedBooking.id)}&deposit=1`} className="mt-3 inline-flex rounded-lg bg-teal px-4 py-2 font-medium text-white">
            Энэ захиалгын урьдчилгаа бүртгэх
          </Link>
        </section>
      )}

      <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Үнийн дүн нь серверийн тухайн үеийн үнээр тооцсон тохиролцсон захиалгын үнэ; мөнгө хүлээн авсны баталгаа биш.
      </div>

      {error && !showForm && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Өнөөдрийн ирэлт", rows: arrivals, icon: CalendarDays },
          { title: "Өнөөдрийн гаралт", rows: departures, icon: CalendarDays },
          { title: "Байрлаж буй зочид", rows: currentGuests, icon: Users },
        ].map(({ title, rows, icon: Icon }) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-sm text-slate-600"><span>{title}</span><Icon size={16} className="text-teal" /></div>
            <strong className="mt-2 block text-2xl text-slate-900">{rows.length}</strong>
            <p className="mt-1 truncate text-xs text-slate-500">{rows.slice(0, 2).map(row => `${row.fname} ${row.lname}`).join(", ") || "Бүртгэл алга"}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={17} className="absolute left-3 top-3 text-slate-400" />
          <input value={search} onChange={event => searchBookings(event.target.value)} placeholder="Нэр, утас, захиалгын дугаар…" className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm" />
        </div>
        <select value={filter} onChange={event => setFilter(event.target.value as "all" | BookingStatus)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="all">Бүх төлөв</option>
          {statuses.map(status => <option key={status} value={status}>{statusNames[status]}</option>)}
        </select>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-teal" /></div>
        ) : visibleBookings.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">Захиалга олдсонгүй.</p>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Лавлах</th><th className="px-4 py-3">Үйлчлүүлэгч</th><th className="px-4 py-3">Өрөө · Хүн</th><th className="px-4 py-3">Ирэх → гарах</th><th className="px-4 py-3">Захиалгын үнэ</th><th className="px-4 py-3">Төлөв</th><th className="px-4 py-3">Эх үүсвэр</th><th className="px-4 py-3">Үйлдэл</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleBookings.map(booking => (
                <tr key={booking.id}>
                  <td className="px-4 py-3 font-mono text-teal">{booking.ref}</td>
                  <td className="px-4 py-3"><strong>{booking.fname} {booking.lname}</strong><div className="text-xs text-slate-500">{booking.phone}</div></td>
                  <td className="px-4 py-3">
                    {booking.room_id} · {booking.guests}
                    <div className="mt-1 text-xs text-slate-500">
                      {booking.bed_allocation_required
                        ? "Орыг ажилтан хуваарилах шаардлагатай"
                        : (booking.bed_assignments || []).filter(assignment => !assignment.released_at).map(assignment => assignment.bed_id).join(", ")}
                    </div>
                      {booking.bed_gender_review_required && (
                        <div className="mt-1 text-xs font-medium text-rose-700">Хүйсийн хуваарилалтыг ажилтан шалгах шаардлагатай</div>
                      )}
                  </td>
                  <td className="px-4 py-3 text-xs">{booking.check_in} → {booking.check_out}</td>
                  <td className="px-4 py-3">{formatMNT(booking.total)}</td>
                  <td className="px-4 py-3">
                    {statusNames[booking.status] || booking.status}
                    {booking.actual_check_in_at && <div className="text-[11px] text-slate-500">Бодит ирэлт: {new Date(booking.actual_check_in_at).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}</div>}
                    {booking.actual_check_out_at && <div className="text-[11px] text-slate-500">Бодит гаралт: {new Date(booking.actual_check_out_at).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}</div>}
                  </td>
                  <td className="px-4 py-3">{booking.source === "walk_in" ? "Биечлэн" : booking.source === "phone" ? "Утас" : "Өмнөх бүртгэл"}</td>
                  <td className="px-4 py-3"><button onClick={() => beginEdit(booking)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50">Нээх</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title" className="my-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="booking-dialog-title" className="text-xl font-semibold text-slate-900">{editing ? `Захиалга засах · ${editing.ref}` : "Шинэ ажилтны захиалга"}</h2>
            <p className="mt-1 text-sm text-slate-500">Зочин бүрт тусдаа ор сонгож, хүйсийг зочноос асууж бүртгэнэ. Нэрээр нь таамаглахгүй.</p>

            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-600">Нэр<input value={form.fname} onChange={e => setField("fname", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label>
              <label className="text-xs text-slate-600">Овог<input value={form.lname} onChange={e => setField("lname", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label>
              <label className="text-xs text-slate-600">Утас<input value={form.phone} onChange={e => setField("phone", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label>
              <label className="text-xs text-slate-600">И-мэйл (сонголтоор)<input value={form.email} onChange={e => setField("email", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label>
              <label className="text-xs text-slate-600 sm:col-span-2">Өрөө / ор
                <select value={form.room_id} onChange={e => setField("room_id", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm">
                  <option value="">Өрөө сонгох</option>
                  {rooms.map(room => <option key={room.id} value={room.id}>{roomLabel(room)}</option>)}
                </select>
              </label>
              <label className="text-xs text-slate-600">Ирэх өдөр<input type="date" min={todayIso()} value={form.check_in} onChange={e => setField("check_in", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label>
              <label className="text-xs text-slate-600">Гарах өдөр ({policy?.stay_nights ?? BOOKING_STAY_NIGHTS} шөнө)<input type="date" value={form.check_out} onChange={e => setField("check_out", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label>
              <label className="text-xs text-slate-600">Зочдын тоо<input type="number" min="1" max={selectedRoom?.category?.capacity ?? undefined} value={form.guests} onChange={e => setField("guests", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label>
              <label className="text-xs text-slate-600">Захиалгын төлөв
                <select value={form.status} onChange={e => setField("status", e.target.value as BookingStatus)} className="mt-1 w-full rounded-lg border p-2.5 text-sm">
                  {statuses.map(status => <option key={status} value={status}>{statusNames[status]}</option>)}
                </select>
              </label>
              {!editing && <>
                <label className="text-xs text-slate-600">Бүртгэсэн хэлбэр
                  <select value={form.source} onChange={e => setField("source", e.target.value as BookingForm["source"])} className="mt-1 w-full rounded-lg border p-2.5 text-sm"><option value="phone">Утсаар</option><option value="walk_in">Биечлэн ирсэн</option></select>
                </label>
                <label className="text-xs text-slate-600">Тэмдэглэсэн төлбөрийн хэлбэр
                  <select value={form.payment} onChange={e => setField("payment", e.target.value as BookingForm["payment"])} className="mt-1 w-full rounded-lg border p-2.5 text-sm"><option value="cash">Бэлэн</option><option value="bank">Банк</option><option value="qpay">QPay</option><option value="card">Карт</option></select>
                </label>
              </>}
              <label className="text-xs text-slate-600 sm:col-span-2">Тэмдэглэл<textarea value={form.notes} onChange={e => setField("notes", e.target.value)} disabled={!!editing} rows={2} className="mt-1 w-full rounded-lg border p-2.5 text-sm disabled:bg-slate-50" /></label>
              {form.status === "cancelled" && <label className="text-xs text-slate-600 sm:col-span-2">Цуцалсан шалтгаан<input value={form.cancellation_reason} onChange={e => setField("cancellation_reason", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label>}
              <div className="sm:col-span-2 rounded-lg border border-slate-200 p-3">
                <h3 className="text-sm font-medium text-slate-800">Зочин тус бүрийн ор</h3>
                <p className="mt-1 text-xs text-slate-500">Нэг захиалгын зочид болон тусдаа захиалгаар өрөөг хуваалцсан бүх зочин ижил, тодорхой хүйстэй байна. Хүйс тодорхойгүй эсвэл зөрүүтэй бол захиалга хадгалахгүй.</p>
                {genderAssignmentConflict && (
                  <p role="alert" className="mt-2 text-xs text-rose-700">Зочин бүрийн хүйсийг сонгож, бүгдийг ижил болгоно уу.</p>
                )}
                <div className="mt-3 space-y-2">
                  {form.bed_assignments.map((assignment, index) => {
                    const choices = availableBeds.filter(bed =>
                      !form.bed_assignments.some((other, otherIndex) => otherIndex !== index && other.bed_id === bed.bed_id)
                    );
                    if (assignment.bed_id && !choices.some(bed => bed.bed_id === assignment.bed_id)) {
                      const retained = rooms.find(room => room.id === form.room_id)?.beds.find(bed => bed.id === assignment.bed_id);
                      if (retained) choices.push({ bed_id: retained.id, label: retained.id, bed_number: retained.bed_number });
                    }
                    return (
                      <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                        <label className="text-xs text-slate-600">
                          Зочин {index + 1} · Хүйс
                          <select
                            value={assignment.guest_gender}
                            onChange={event => setGuestBedAssignment(index, { guest_gender: event.target.value as BedAssignment["guest_gender"] })}
                            className="mt-1 w-full rounded-lg border p-2.5 text-sm"
                          >
                            <option value="female">Эмэгтэй</option>
                            <option value="male">Эрэгтэй</option>
                            <option value="unknown">Тодорхойгүй</option>
                          </select>
                        </label>
                        <label className="text-xs text-slate-600">
                          Сонгосон ор
                          <select
                            value={assignment.bed_id}
                            onChange={event => setGuestBedAssignment(index, { bed_id: event.target.value })}
                            className="mt-1 w-full rounded-lg border p-2.5 text-sm"
                          >
                            <option value="">Ор сонгоно уу</option>
                            {choices.map(bed => <option key={bed.bed_id} value={bed.bed_id}>{bed.label}</option>)}
                          </select>
                        </label>
                      </div>
                    );
                  })}
                </div>
                {allocationRequired && <p role="alert" className="mt-3 text-xs text-amber-800">Энэ өрөөнд ор хуваарилаагүй хуучин захиалга байна. Эхлээд тухайн захиалгыг ажилтан бодитоор хуваарилна.</p>}
                {genderConflict && <p role="alert" className="mt-3 text-xs text-red-700">Өрөөний хүйс хуваалцах дүрэм зөрчигдөж байна.</p>}
              </div>
            </div>

            <div className={`mt-4 rounded-lg border p-3 text-sm ${availability === "available" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : availability === "full" || availability === "closed" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-900"}`} role="status">
              {availabilityMessage(availability)}
              {dateError && <p className="mt-1">Огноо 7 шөнө байх ба өнөөдрөөс хойш 3 сарын дотор эхэлнэ.</p>}
            </div>
            {!editing && <p className="mt-3 text-sm text-slate-700">Серверийн үнээр тооцсон дүн: <strong>{estimatedTotal === null ? "Үнийн мэдээлэл алга" : formatMNT(estimatedTotal)}</strong> · Төлбөрийн баталгаа биш.</p>}
            {editing && canManage && (
              <div className="mt-3 space-y-2 rounded-lg border border-slate-200 p-3">
                <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.adjust_price} onChange={e => setField("adjust_price", e.target.checked)} /> Тохиролцсон үнийг одоогийн DB үнээр дахин тооцох</label>
                {form.adjust_price && <label className="block text-xs text-slate-600">Үнийн өөрчлөлтийн шалтгаан<input value={form.price_adjustment_reason} onChange={e => setField("price_adjustment_reason", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label>}
                <p className="text-xs text-slate-500">Огноо, өрөө, зочдын тоо өөрчлөгдсөн ч үнэ тусгайлан засахгүй бол одоогийн тохиролцсон дүн хэвээр үлдэнэ.</p>
              </div>
            )}
            {editing && !canManage && (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                Зөвшөөрөгдсөн үнийн өөрчлөлтийг менежер бүртгэнэ. Одоогийн тохирсон үнэ хадгалагдана.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); setError(""); }} disabled={saving} className="rounded-lg border px-4 py-2 text-sm">Болих</button>
              <button onClick={() => void saveBooking()} disabled={!canSave || !form.fname.trim() || !form.lname.trim() || !form.phone.trim()} className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
                {saving && <Loader2 size={15} className="animate-spin" />} Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
