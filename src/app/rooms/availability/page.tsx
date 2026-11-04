"use client";

import { useEffect, useMemo, useState } from "react";
import { rooms as roomDescriptions } from "@/lib/data";
import { addUtcDays, validateBookingDates } from "@/lib/booking-rules";
import { ulaanbaatarToday } from "@/lib/bed-availability";
import { useLang } from "@/lib/lang-context";
import { formatMntAmount } from "@/lib/payment-ledger";

type PublicBed = {
  bed_id: string;
  state: "available" | "reserved_for_dates" | "occupied_now" | "closed" | "allocation_required" | "gender_restricted" | "gender_conflict";
  occupied_now: boolean;
  occupant_gender: "female" | "male" | "unknown" | null;
  departure_status: "scheduled" | "leaves_today" | "overdue" | null;
  days_remaining: number | null;
};
type PublicRoom = {
  room_id: string;
  category_id: string;
  beds: PublicBed[];
  allocation_required: boolean;
  gender_for_dates: "female" | "male" | null;
  gender_conflict: boolean;
  gender_matches_selection: boolean;
};
type GuestGender = "" | "female" | "male";
type BookingPolicy = { stay_nights: number; advance_months: number };
type RoomRates = {
  id: string;
  adult1: number | null;
  adult2: number | null;
  child02: number | null;
  child37a: number | null;
  child37b: number | null;
  child812a: number | null;
  child812b: number | null;
};

function bedStateLabel(state: PublicBed["state"], lang: "mn" | "en") {
  const labels = {
    available: { mn: "Сонгосон өдөр сул", en: "Available for these dates" },
    reserved_for_dates: { mn: "Сонгосон өдөр захиалгатай", en: "Reserved for these dates" },
    occupied_now: { mn: "Одоо хүн байрлаж байна", en: "Occupied now" },
    closed: { mn: "Өрөө хаалттай", en: "Room closed" },
    allocation_required: { mn: "Мэдээлэл тодруулах шаардлагатай", en: "Staff allocation required" },
    gender_restricted: { mn: "Хүйсийн хуваалцах дүрмээр боломжгүй", en: "Unavailable under room-sharing rules" },
    gender_conflict: { mn: "Захиалгын хүйсийн зөрчилтэй — өрөө боломжгүй", en: "Conflicting reservation genders — room unavailable" },
  };
  return labels[state][lang];
}

function genderLabel(gender: PublicBed["occupant_gender"], lang: "mn" | "en") {
  if (gender === "female") return lang === "mn" ? "Эмэгтэй" : "Female";
  if (gender === "male") return lang === "mn" ? "Эрэгтэй" : "Male";
  return lang === "mn" ? "Тодорхойгүй" : "Unknown";
}

function departureLabel(bed: PublicBed, lang: "mn" | "en") {
  if (bed.departure_status === "leaves_today") return lang === "mn" ? "Өнөөдөр явах хуваарьтай" : "Scheduled to leave today";
  if (bed.departure_status === "overdue") return lang === "mn" ? "Хуваарьт хугацаа хэтэрсэн; гараагүй" : "Overdue; not checked out";
  if (bed.departure_status === "scheduled" && bed.days_remaining !== null) {
    return lang === "mn"
      ? `${bed.days_remaining} өдөр үлдсэн (хуваарьт)`
      : `${bed.days_remaining} scheduled day${bed.days_remaining === 1 ? "" : "s"} remaining`;
  }
  return "";
}

export default function BedAvailabilityPage() {
  const { lang } = useLang();
  const today = useMemo(() => ulaanbaatarToday(), []);
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addUtcDays(today, 7));
  const [gender, setGender] = useState<GuestGender>("");
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [policy, setPolicy] = useState<BookingPolicy | null>(null);
  const [policyState, setPolicyState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [policyError, setPolicyError] = useState("");
  const [roomRates, setRoomRates] = useState<RoomRates[]>([]);
  const [priceError, setPriceError] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedBedIds, setSelectedBedIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/bed-availability?policy=true")
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Booking policy could not be loaded.");
        if (!Number.isInteger(result.policy?.stay_nights) || !Number.isInteger(result.policy?.advance_months)) {
          throw new Error("Booking policy response is invalid.");
        }
        if (active) {
          setPolicy(result.policy as BookingPolicy);
          setCheckOut(addUtcDays(today, result.policy.stay_nights));
          setPolicyState("ready");
          setPolicyError("");
        }
      })
      .catch(loadError => {
        if (active) {
          setPolicyState("unavailable");
          setPolicyError(loadError instanceof Error ? loadError.message : "Booking policy could not be loaded.");
        }
      });
    return () => { active = false; };
  }, [today]);

  useEffect(() => {
    if (policyState !== "ready") return;
    let active = true;
    fetch("/api/rooms", { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.rooms)) {
          throw new Error(result.error || "Room prices could not be loaded.");
        }
        if (active) setRoomRates(result.rooms as RoomRates[]);
      })
      .catch(loadError => {
        if (active) setPriceError(loadError instanceof Error ? loadError.message : "Room prices could not be loaded.");
      });
    return () => { active = false; };
  }, [policyState]);

  const dateError = policyState === "loading"
    ? (lang === "mn" ? "Захиалгын нөхцөлийг ачаалж байна." : "Loading booking requirements.")
    : policyState === "unavailable"
      ? policyError
    : gender
      ? validateBookingDates(checkIn, checkOut, today, policy?.stay_nights ?? 7, policy?.advance_months ?? 3)
      : (lang === "mn" ? "Хуваалцах дүрмийг шалгахын тулд зочны хүйсийг сонгоно уу." : "Select guest gender to check the room-sharing rule.");

  useEffect(() => {
    if (dateError || !gender || !policy) {
      return;
    }

    const controller = new AbortController();
    const query = new URLSearchParams({ checkin: checkIn, checkout: checkOut, gender });
    const timer = setTimeout(() => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError("");
      fetch(`/api/bed-availability?${query}`, { signal: controller.signal })
        .then(async response => {
          const result = await response.json();
          if (!response.ok || !Array.isArray(result.rooms)) {
            throw new Error(result.error || "Bed availability could not be loaded.");
          }
          setRooms(result.rooms as PublicRoom[]);
        })
        .catch(loadError => {
          if (!controller.signal.aborted) {
            setRooms([]);
            setError(loadError instanceof Error ? loadError.message : "Bed availability could not be loaded.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [checkIn, checkOut, dateError, gender, policy]);

  const roomNames = useMemo(() => new Map(roomDescriptions.map(room => [room.id, room.name[lang]])), [lang]);
  const rateByCategory = useMemo(() => new Map(roomRates.map(rate => [rate.id, rate])), [roomRates]);
  const rateLabels: Array<[keyof Omit<RoomRates, "id">, { mn: string; en: string }]> = [
    ["adult1", { mn: "Насанд хүрэгч (1)", en: "Adult (1)" }],
    ["adult2", { mn: "Насанд хүрэгч (2)", en: "Adult (2)" }],
    ["child02", { mn: "Хүүхэд (0–2 нас)", en: "Child (age 0–2)" }],
    ["child37a", { mn: "Хүүхэд (3–7 нас, 1-р)", en: "Child (age 3–7, first)" }],
    ["child37b", { mn: "Хүүхэд (3–7 нас, 2-р)", en: "Child (age 3–7, second)" }],
    ["child812a", { mn: "Хүүхэд (8–12 нас, 1-р)", en: "Child (age 8–12, first)" }],
    ["child812b", { mn: "Хүүхэд (8–12 нас, 2-р)", en: "Child (age 8–12, second)" }],
  ];

  const clearBedSelection = () => {
    setRooms([]);
    setSelectedRoomId("");
    setSelectedBedIds([]);
    setError("");
    setLoading(false);
  };

  const toggleBed = (roomId: string, bedId: string) => {
    if (selectedBedIds.includes(bedId)) {
      const remaining = selectedBedIds.filter(id => id !== bedId);
      setSelectedBedIds(remaining);
      if (remaining.length === 0) setSelectedRoomId("");
      return;
    }
    if (selectedBedIds.length >= guestCount || (selectedRoomId && selectedRoomId !== roomId)) return;
    setSelectedRoomId(roomId);
    setSelectedBedIds(current => [...current, bedId]);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal">{lang === "mn" ? "Байр, өрөө" : "Accommodation"}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {lang === "mn" ? "Өрөө, орны хүртээмж" : "Room and bed availability"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            {lang === "mn"
              ? "Өрөө бүрийн тусдаа орны сонгосон хугацааны төлөвийг харна. Одоо байрлаж буй зочны нэр болон захиалгын мэдээлэл энд харагдахгүй."
              : "See individual bed status for your selected dates. Current guests’ names and booking details are never shown here."}
          </p>
        </header>

        <ol aria-label={lang === "mn" ? "Захиалгын алхам" : "Booking steps"} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-5">
          {[
            lang === "mn" ? "1. Огноо" : "1. Dates",
            lang === "mn" ? "2. Ор сонгох" : "2. Select beds",
            lang === "mn" ? "3. Зочны мэдээлэл" : "3. Guest details",
            lang === "mn" ? "4. Үнэ шалгах" : "4. Review price",
            lang === "mn" ? "5. Захиалга илгээх" : "5. Submit",
          ].map((step, index) => (
            <li key={step} className={`rounded-lg px-2 py-2 ${index < 2 ? "bg-teal/10 font-medium text-teal-900" : "bg-slate-50 text-slate-500"}`}>
              {step}
              {index > 1 && <span className="mt-1 block text-[11px]">{lang === "mn" ? "Онлайн захиалга хаалттай" : "Online booking closed"}</span>}
            </li>
          ))}
        </ol>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-slate-700">
            {lang === "mn" ? "Ирэх өдөр" : "Check-in"}
            <input
              type="date"
              min={today}
              value={checkIn}
              disabled={!policy}
              onChange={event => {
                const nextCheckIn = event.target.value;
                setCheckIn(nextCheckIn);
                if (nextCheckIn) setCheckOut(addUtcDays(nextCheckIn, policy?.stay_nights ?? 7));
                clearBedSelection();
              }}
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5"
            />
          </label>
          <label className="text-sm text-slate-700">
            {lang === "mn"
              ? `Гарах өдөр (${policy?.stay_nights ?? 7} шөнө)`
              : `Check-out (${policy?.stay_nights ?? 7} nights)`}
            <input
              type="date"
              value={checkOut}
              disabled={!policy}
              onChange={event => {
                setCheckOut(event.target.value);
                clearBedSelection();
              }}
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5"
            />
          </label>
          <label className="text-sm text-slate-700">
            {lang === "mn" ? "Зочны хүйс" : "Guest gender"}
            <select value={gender} disabled={!policy} onChange={event => {
              setGender(event.target.value as GuestGender);
              clearBedSelection();
            }} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5">
              <option value="">{lang === "mn" ? "Сонгоно уу" : "Select"}</option>
              <option value="female">{lang === "mn" ? "Эмэгтэй" : "Female"}</option>
              <option value="male">{lang === "mn" ? "Эрэгтэй" : "Male"}</option>
            </select>
          </label>
          <label className="text-sm text-slate-700">
            {lang === "mn" ? "Зочдын тоо / орны тоо" : "Guests / beds needed"}
            <select
              value={guestCount}
              onChange={event => {
                const count = Number(event.target.value);
                setGuestCount(count);
                const remaining = selectedBedIds.slice(0, count);
                setSelectedBedIds(remaining);
                if (remaining.length === 0) setSelectedRoomId("");
              }}
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5"
            >
              {[1, 2, 3, 4, 5].map(count => <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            {dateError && <p role="alert" className="text-sm text-amber-800">{dateError}</p>}
          </div>
        </section>

        <div role="note" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {lang === "mn"
            ? "Гарах өдөр нь зөвхөн хуваарь юм. Тэр өдөр өнгөрөхөд ор сул болсон гэж батлахгүй; ажилтан бодитоор гарахыг бүртгэнэ."
            : "Checkout is scheduled, not guaranteed. A bed is not considered vacated until staff record the actual checkout."}
        </div>

        {!dateError && loading && <p role="status" className="rounded-xl bg-white p-6 text-sm text-slate-500">{lang === "mn" ? "Орны хүртээмжийг шалгаж байна…" : "Loading bed availability…"}</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {priceError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{priceError}</p>}
        {policyState === "loading" && <p role="status" className="rounded-xl bg-white p-6 text-sm text-slate-500">{lang === "mn" ? "Нөхцөл болон үнийг ачаалж байна…" : "Loading booking requirements and prices…"}</p>}
        {policyState === "unavailable" && (
          <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            {lang === "mn" ? "Хүртээмжийн урьдчилсан харагдац идэвхгүй эсвэл тохируулагдаагүй. Захиалга хийх боломжгүй." : "The availability preview is disabled or not configured. Booking is unavailable."}
          </p>
        )}
        {!loading && !error && !dateError && policyState === "ready" && rooms.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            {lang === "mn"
              ? "Сонгосон хугацаанд хүртээмжийн мэдээлэл ирсэнгүй."
              : "No availability data was returned for the selected dates."}
          </p>
        )}

        <div className="space-y-4">
          {rooms.map(room => (
            <section key={room.room_id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">
                {roomNames.get(room.category_id) || room.category_id} · {room.room_id}
              </h2>
              {room.allocation_required && (
                <p className="mt-2 text-xs text-amber-800">
                  {lang === "mn" ? "Хуучин захиалгын орны хуваарилалтыг ажилтан тодруулж байна." : "Staff are resolving a legacy bed allocation."}
                </p>
              )}
              <p className={`mt-2 text-sm ${room.gender_conflict || !room.gender_matches_selection ? "text-rose-700" : "text-slate-600"}`}>
                {room.gender_conflict
                  ? (lang === "mn" ? "Сонгосон хугацаанд хүйсийн зөрчил байна. Өрөө бүхэл хугацаанд боломжгүй." : "Reservations with conflicting genders overlap these dates. The room is unavailable for this stay.")
                  : room.gender_for_dates
                    ? (lang === "mn"
                      ? `Сонгосон хугацааны өрөөний хүйс: ${genderLabel(room.gender_for_dates, lang)}${room.gender_matches_selection ? "" : " — сонгосон хүйст боломжгүй"}`
                      : `Room gender for selected dates: ${genderLabel(room.gender_for_dates, lang)}${room.gender_matches_selection ? "" : " — unavailable for the selected gender"}`)
                    : (lang === "mn" ? "Сонгосон хугацаанд өрөөний хүйс тогтоогүй." : "No gender designation is established for these dates.")}
              </p>
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <h3 className="text-sm font-medium text-slate-800">{lang === "mn" ? "Өрөөний үнийн жагсаалт" : "Room rate schedule"}</h3>
                {rateByCategory.has(room.category_id) ? (
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                    {rateLabels.map(([key, label]) => {
                      const amount = rateByCategory.get(room.category_id)?.[key];
                      return amount === null || amount === undefined ? null : (
                        <div key={key} className="flex justify-between gap-2">
                          <dt className="text-slate-600">{label[lang]}</dt>
                          <dd className="font-medium text-slate-900">{formatMntAmount(amount)} / {lang === "mn" ? "шөнө" : "night"}</dd>
                        </div>
                      );
                    })}
                  </dl>
                ) : (
                  <p role="status" className="mt-2 text-xs text-amber-800">{lang === "mn" ? "Үнийг баталгаажуулж чадсангүй." : "Rates could not be verified."}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {lang === "mn"
                    ? "Үнэ нь мэдээллийн сангийн одоогийн ангиллын жагсаалт. Эцсийн үнийг ажилтан зочдын бүрэлдэхүүнээр баталгаажуулна."
                    : "Rates are the current database catalogue for this category. Staff must confirm the final price for the guest mix."}
                </p>
              </div>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {room.beds.map(bed => {
                  const selected = selectedBedIds.includes(bed.bed_id);
                  const selectable = bed.state === "available" &&
                    room.gender_matches_selection &&
                    !room.gender_conflict &&
                    !room.allocation_required &&
                    (!selectedRoomId || selectedRoomId === room.room_id) &&
                    (selected || selectedBedIds.length < guestCount);
                  return (
                    <li key={bed.bed_id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        aria-label={`${bed.bed_id}: ${bedStateLabel(bed.state, lang)}`}
                        disabled={!selectable && !selected}
                        onClick={() => toggleBed(room.room_id, bed.bed_id)}
                        className={`w-full rounded-lg border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${selected ? "border-teal bg-teal/5" : "border-slate-200"} disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-800">{bed.bed_id}</span>
                          <span aria-hidden="true" className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${selected ? "border-teal bg-teal text-white" : "border-slate-400"}`}>
                            {selected ? "✓" : ""}
                          </span>
                        </span>
                        <span className={`mt-1 block text-sm ${bed.state === "available" ? "text-emerald-700" : "text-slate-600"}`}>
                          {bedStateLabel(bed.state, lang)}
                        </span>
                        {bed.occupied_now && bed.occupant_gender && (
                          <span className="mt-1 block text-xs text-slate-500">
                            {genderLabel(bed.occupant_gender, lang)}
                            {` · ${departureLabel(bed, lang)}`}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {selectedBedIds.length > 0 && (
          <section aria-live="polite" className="rounded-2xl border border-teal/30 bg-white p-5">
            <h2 className="font-semibold text-slate-900">{lang === "mn" ? "Сонгосон ор" : "Selected beds"}</h2>
            <p className="mt-1 text-sm text-slate-700">{selectedBedIds.join(", ")} · {selectedBedIds.length}/{guestCount}</p>
            <p className="mt-2 text-sm text-amber-800">
              {lang === "mn"
                ? "Энэ нь зөвхөн урьдчилсан сонголт бөгөөд захиалга үүсгэхгүй, орныг барихгүй. Онлайн захиалга хаалттай."
                : "This is a preview selection only. It does not create a booking or hold beds. Online booking is closed."}
            </p>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">{lang === "mn" ? "Байрлах болон төлбөрийн мэдээлэл" : "Stay and payment information"}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>{lang === "mn" ? `Одоогийн системийн дүрэм: ${policy?.stay_nights ?? 7} шөнө; ${policy?.advance_months ?? 3} сар хүртэл урьдчилан сонгоно.` : `Current system rules: ${policy?.stay_nights ?? 7} nights; dates can be selected up to ${policy?.advance_months ?? 3} months ahead.`}</li>
            <li>{lang === "mn" ? "Одоогийн өрөөний мэдээлэлд халуун, хүйтэн ус, хувийн ариун цэврийн өрөө, телевиз, Wi-Fi гэж заасан." : "Existing room information lists hot and cold water, a private bathroom, TV, and Wi-Fi."}</li>
            <li>{lang === "mn" ? "QPay болон онлайн төлбөр холбогдоогүй. Онлайн төлбөр амжилттай болсон гэж үзэхгүй. Хүлээн авалтад бэлэн мөнгө эсвэл ажилтнаар баталгаажуулах банкны шилжүүлэг." : "QPay and online payments are not connected. No online payment can be completed. Reception accepts cash or bank transfers verified by staff."}</li>
            <li className="text-amber-800">{lang === "mn" ? "Цуцлалт, буцаалтын нөхцөл нийтлэхээр баталгаажаагүй. Захиалга нээхээс өмнө бизнесийн эзэн энэ нөхцөлийг батлах шаардлагатай." : "Cancellation and refund terms have not been approved for publication. The business owner must confirm them before bookings open."}</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
