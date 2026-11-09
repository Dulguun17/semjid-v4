"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookingSteps } from "@/components/ui/BookingSteps";
import { BookingArrivalChecklist } from "@/components/ui/BookingArrivalChecklist";
import { BookingWhatToExpect } from "@/components/ui/BookingWhatToExpect";
import { BookingFAQ } from "@/components/ui/BookingFAQ";
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
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [draftReady, setDraftReady] = useState(false);

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
          let restored = false;
          try {
            const raw = sessionStorage.getItem("semjid:booking-selection");
            const draft = raw ? JSON.parse(raw) : null;
            if (draft && typeof draft.checkIn === "string" && typeof draft.checkOut === "string"
              && !validateBookingDates(draft.checkIn, draft.checkOut, today, result.policy.stay_nights, result.policy.advance_months)
              && ["female", "male"].includes(draft.gender) && Number.isInteger(draft.guestCount) && draft.guestCount >= 1 && draft.guestCount <= 5) {
              setCheckIn(draft.checkIn);
              setCheckOut(draft.checkOut);
              setGender(draft.gender);
              setGuestCount(draft.guestCount);
              setSelectedRoomId(typeof draft.roomId === "string" ? draft.roomId : "");
              setSelectedBedIds(Array.isArray(draft.bedIds) ? draft.bedIds.filter((id: unknown) => typeof id === "string").slice(0, draft.guestCount) : []);
              restored = true;
            }
          } catch { /* A new selection still works when browser storage is unavailable. */ }
          if (!restored) setCheckOut(addUtcDays(today, result.policy.stay_nights));
          setDraftReady(true);
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
  }, [today, refreshVersion]);

  useEffect(() => {
    if (!draftReady || policyState !== "ready") return;
    try {
      sessionStorage.setItem("semjid:booking-selection", JSON.stringify({ checkIn, checkOut, gender, guestCount, roomId: selectedRoomId, bedIds: selectedBedIds }));
    } catch { /* The selection remains available in the current page. */ }
  }, [draftReady, policyState, checkIn, checkOut, gender, guestCount, selectedRoomId, selectedBedIds]);

  useEffect(() => {
    if (policyState !== "ready") return;
    let active = true;
    fetch("/api/rooms", { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.rooms)) {
          throw new Error(result.error || "Room prices could not be loaded.");
        }
        if (active) { setRoomRates(result.rooms as RoomRates[]); setPriceError(""); }
      })
      .catch(loadError => {
        if (active) setPriceError(loadError instanceof Error ? loadError.message : "Room prices could not be loaded.");
      });
    return () => { active = false; };
  }, [policyState, refreshVersion]);

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
          setSelectedBedIds(current => current.filter(id => result.rooms.some((room: PublicRoom) => room.beds.some(bed => bed.bed_id === id && bed.state === "available"))));
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
  }, [checkIn, checkOut, dateError, gender, policy, refreshVersion]);

  const roomNames = useMemo(() => new Map(roomDescriptions.map(room => [room.id, room.name[lang]])), [lang]);
  const rateByCategory = useMemo(() => new Map(roomRates.map(rate => [rate.id, rate])), [roomRates]);

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
      return;
    }
    if (selectedBedIds.length >= guestCount || (selectedRoomId && selectedRoomId !== roomId)) return;
    setSelectedRoomId(roomId);
    setSelectedBedIds(current => [...current, bedId]);
  };

  const selectedRoom = rooms.find(room => room.room_id === selectedRoomId);
  const currentStep = selectedRoom ? 3 : !dateError && rooms.length ? 2 : 1;
  const selectedRate = selectedRoom ? rateByCategory.get(selectedRoom.category_id) : null;
  const nightlyRate = selectedRate?.adult1 ?? selectedRate?.adult2 ?? null;
  const selectionReady = selectedRoom && nightlyRate !== null && !priceError && selectedBedIds.length === guestCount
    && selectedBedIds.every(id => selectedRoom.beds.some(bed => bed.bed_id === id && bed.state === "available"));
  const dateMessages: Record<string, { mn: string; en: string }> = {
    invalid_date: { mn: "Ирэх, гарах өдрөө шалгана уу.", en: "Check your arrival and departure dates." },
    stay_duration_mismatch: { mn: `Одоогийн байрлах хугацаа ${policy?.stay_nights ?? 7} шөнө байна.`, en: `The current stay length is ${policy?.stay_nights ?? 7} nights.` },
    check_in_in_past: { mn: "Ирэх өдөр өнгөрсөн байна.", en: "Choose an arrival date from today onward." },
    too_far_in_advance: { mn: `Огноог ${policy?.advance_months ?? 3} сарын дотор сонгоно уу.`, en: `Choose an arrival within ${policy?.advance_months ?? 3} months.` },
  };
  const dateMessage = policyState === "unavailable"
    ? (lang === "mn" ? "Захиалгын нөхцөл ачаалагдсангүй. Дахин ачаална уу." : "Booking requirements could not be loaded. Please retry.")
    : dateError ? dateMessages[dateError]?.[lang] ?? dateError : null;
  const retry = () => {
    setError("");
    setPriceError("");
    setPolicyError("");
    setRefreshVersion(value => value + 1);
  };
  const chooseAnotherRoom = () => {
    setSelectedRoomId("");
    setSelectedBedIds([]);
  };

  return (
    <main className="min-h-screen bg-[#f6f5f1] px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Semjid Khujirt</p>
          <h1 className="font-serif text-3xl leading-tight text-slate-900 sm:text-4xl">
            {lang === "mn" ? "Байрлах захиалгаа төлөвлөх" : "Plan your stay"}
          </h1>
          <p className="text-base leading-7 text-slate-600">
            {lang === "mn" ? "Огноо, зочдоо сонгоод нэг өрөөний орнуудаас сонгоно уу. Хадгалахын өмнө нийт үнэ, мэдээллээ шалгана." : "Choose your dates and guests, then select beds in one room. Review the total and your details before saving."}
          </p>
        </header>

        <BookingSteps activeStep={currentStep} />

        <section id="booking-filters" aria-labelledby="stay-details-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="stay-details-heading" className="text-xl font-semibold text-slate-900">{lang === "mn" ? "1. Огноо, зочид" : "1. Dates & guests"}</h2>
            <p className="text-sm text-slate-600">{lang === "mn" ? "Насанд хүрэгчдийн үнийн туршилтын захиалга" : "Adult-rate booking preview"}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">
              {lang === "mn" ? "Ирэх өдөр" : "Check-in"}
              <input type="date" min={today} value={checkIn} disabled={!policy} onChange={event => {
                const value = event.target.value;
                setCheckIn(value);
                if (value) setCheckOut(addUtcDays(value, policy?.stay_nights ?? 7));
                clearBedSelection();
              }} className="mt-2 block min-h-12 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-base" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {lang === "mn" ? `Гарах өдөр · ${policy?.stay_nights ?? 7} шөнө` : `Check-out · ${policy?.stay_nights ?? 7} nights`}
              <input type="date" value={checkOut} disabled={!policy} onChange={event => { setCheckOut(event.target.value); clearBedSelection(); }} className="mt-2 block min-h-12 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-base" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {lang === "mn" ? "Зочдын хүйс" : "Guest gender"}
              <select value={gender} disabled={!policy} onChange={event => { setGender(event.target.value as GuestGender); clearBedSelection(); }} className="mt-2 block min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base">
                <option value="">{lang === "mn" ? "Сонгоно уу" : "Select"}</option>
                <option value="female">{lang === "mn" ? "Эмэгтэй" : "Female"}</option>
                <option value="male">{lang === "mn" ? "Эрэгтэй" : "Male"}</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              {lang === "mn" ? "Насанд хүрсэн зочид" : "Adult guests"}
              <select value={guestCount} onChange={event => {
                const count = Number(event.target.value);
                setGuestCount(count);
                setSelectedBedIds(current => current.slice(0, count));
              }} className="mt-2 block min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base">
                {[1, 2, 3, 4, 5].map(count => <option key={count} value={count}>{count}</option>)}
              </select>
            </label>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{lang === "mn" ? "Нэг өрөөнд нэг ижил хүйсийн зочид байрлана. Хүүхэд болон тусгай багцын үнийг хүлээн авалтаас тодруулна уу." : "Guests sharing a room must have the same known gender. Ask reception about child and package pricing."}</p>
          {dateMessage && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{dateMessage}</p>}
        </section>

        <BookingArrivalChecklist />
        <BookingWhatToExpect />

        {(error || priceError || policyState === "unavailable") && (
          <div role="alert" className="rounded-xl border border-red-200 bg-white p-5">
            <p className="text-base font-medium text-red-800">{lang === "mn" ? "Өрөө, үнийг одоогоор баталгаажуулж чадсангүй." : "Rooms and prices could not be verified right now."}</p>
            <p className="mt-2 text-sm text-slate-600">{lang === "mn" ? "Таны огноо, зочдын сонголт хадгалагдана. Дахин ачаалаад оролдоно уу." : "Your dates and guest selection are preserved. Reload the availability and try again."}</p>
            <button type="button" onClick={retry} className="mt-4 min-h-11 rounded-lg border border-slate-300 px-4 font-medium">{lang === "mn" ? "Дахин ачаалах" : "Retry availability"}</button>
          </div>
        )}
        {(loading || policyState === "loading") && <p role="status" className="rounded-xl bg-white p-5 text-slate-700">{lang === "mn" ? "Өрөө, үнийг шалгаж байна…" : "Checking rooms and prices…"}</p>}

        {!dateError && !loading && !error && !selectedRoom && (
          <section aria-labelledby="choose-room-heading" className="space-y-5">
            <div>
              <h2 id="choose-room-heading" className="text-2xl font-semibold text-slate-900">{lang === "mn" ? "2. Нэг өрөө сонгох" : "2. Choose one room"}</h2>
              <p className="mt-2 text-base text-slate-600">{lang === "mn" ? "Зураг, насанд хүрэгчдийн үнэ болон сул орны тоог харьцуулаад өрөөгөө сонгоно уу." : "Compare the photos, adult rates and available beds, then choose your room."}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {rooms.map(room => {
                const description = roomDescriptions.find(item => item.id === room.category_id);
                const rates = rateByCategory.get(room.category_id);
                const rate = rates?.adult1 ?? rates?.adult2 ?? null;
                const available = room.beds.filter(bed => bed.state === "available").length;
                const canChoose = available >= guestCount && room.gender_matches_selection && !room.gender_conflict && !room.allocation_required && rate !== null;
                return (
                  <article key={room.room_id} data-room-card={room.room_id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="relative h-52 sm:h-60">
                      <Image src={description?.img ?? "/images/image3.jpeg"} alt={description?.name[lang] ?? room.room_id} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                      <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-900">{lang === "mn" ? "Өрөө" : "Room"} {room.room_id}</span>
                    </div>
                    <div className="space-y-4 p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-serif text-2xl text-slate-900">{roomNames.get(room.category_id) ?? room.category_id}</h3>
                          <p className="mt-1 text-sm text-slate-600">{available}/{room.beds.length} {lang === "mn" ? "ор сул" : "beds available"}</p>
                        </div>
                        <p className="text-xl font-semibold text-slate-900">{rate === null ? "—" : formatMntAmount(rate)}<span className="mt-1 block text-right text-xs font-normal text-slate-600">{lang === "mn" ? "1 насанд хүрэгч / шөнө" : "per adult / night"}</span></p>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{description?.desc[lang]}</p>
                      <ul className="flex flex-wrap gap-2 text-xs text-slate-700">
                        {description?.amenities.slice(0, 3).map(item => <li key={item.en} className="rounded-full bg-slate-100 px-3 py-1.5">{item[lang]}</li>)}
                      </ul>
                      <p className="text-sm leading-6 text-slate-600">{lang === "mn" ? "Хоол, багцад багтах үйлчилгээг хүлээн авалтаас тодруулна. Эмчилгээг эмчтэй зөвлөлдөн сонгоно." : "Confirm meals and package inclusions with reception. Treatments depend on a clinical consultation."}</p>
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-slate-100 pt-4">
                        <p className="text-sm text-slate-600">{guestCount} {lang === "mn" ? "зочин" : "adult(s)"} · {policy?.stay_nights} {lang === "mn" ? "шөнө" : "nights"}</p>
                        <p className="text-lg font-semibold text-slate-900">{rate === null ? (lang === "mn" ? "Үнэ тодруулах" : "Rate unavailable") : formatMntAmount((BigInt(rate) * BigInt(guestCount) * BigInt(policy?.stay_nights ?? 7)).toString())}</p>
                      </div>
                      <button type="button" data-select-room={room.room_id} disabled={!canChoose} onClick={() => { setSelectedRoomId(room.room_id); setSelectedBedIds([]); }} className="min-h-12 w-full rounded-lg bg-teal px-4 py-3 text-base font-semibold text-white disabled:bg-slate-100 disabled:text-slate-600">
                        {canChoose ? (lang === "mn" ? "Энэ өрөөний ор сонгох" : "Choose beds in this room") : (lang === "mn" ? "Энэ сонголтод боломжгүй" : "Unavailable for this selection")}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {rooms.length === 0 && <p className="rounded-xl bg-white p-5 text-slate-600">{lang === "mn" ? "Өрөөний мэдээлэл ирсэнгүй. Дахин шалгана уу." : "No room information was returned. Please retry."}</p>}
          </section>
        )}

        {selectedRoom && !dateError && !loading && (
          <section id="room-beds" aria-labelledby="choose-beds-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <button type="button" onClick={chooseAnotherRoom} className="mb-5 min-h-11 text-sm font-semibold text-teal underline">← {lang === "mn" ? "Өрөөнүүд рүү буцах" : "Back to rooms"}</button>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-teal">{lang === "mn" ? "Өрөө" : "Room"} {selectedRoom.room_id} · {roomNames.get(selectedRoom.category_id)}</p>
                <h2 id="choose-beds-heading" className="mt-2 text-2xl font-semibold text-slate-900">{lang === "mn" ? "3. Зочин бүрт нэг ор сонгох" : "3. Choose one bed per guest"}</h2>
              </div>
              <p aria-live="polite" className="rounded-full bg-teal/10 px-4 py-2 font-semibold text-teal-900">{selectedBedIds.length} / {guestCount} {lang === "mn" ? "ор сонгосон" : "beds selected"}</p>
            </div>
            <p className="mt-3 text-base text-slate-600">{checkIn} — {checkOut} · {genderLabel(gender || null, lang)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{lang === "mn" ? "Зөвхөн сул гэж тэмдэглэсэн ор сонгоно. Сонголт нь захиалга хадгалах хүртэл орныг түр барихгүй." : "Choose beds marked available. Your selection is not held until the request is saved."}</p>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {selectedRoom.beds.map(bed => {
                const selected = selectedBedIds.includes(bed.bed_id);
                const selectable = bed.state === "available" && selectedRoom.gender_matches_selection && !selectedRoom.gender_conflict && !selectedRoom.allocation_required && (selected || selectedBedIds.length < guestCount);
                return (
                  <li key={bed.bed_id}>
                    <button type="button" role="checkbox" aria-checked={selected} aria-label={`${lang === "mn" ? "Өрөө" : "Room"} ${selectedRoom.room_id}, ${lang === "mn" ? "ор" : "bed"} ${bed.bed_id}, ${selected ? (lang === "mn" ? "сонгосон" : "selected") : bedStateLabel(bed.state, lang)}`} disabled={!selectable && !selected} onClick={() => toggleBed(selectedRoom.room_id, bed.bed_id)}
                      className={`min-h-28 w-full rounded-xl border p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${selected ? "border-teal bg-teal text-white" : selectable ? "border-teal/40 bg-white text-slate-900" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                      <span className="flex items-center justify-between gap-2 text-base font-semibold"><span>{bed.bed_id}</span><span aria-hidden="true">{selected ? "✓" : "○"}</span></span>
                      <span className="mt-2 block text-sm leading-5">{selected ? (lang === "mn" ? "Сонгосон" : "Selected") : bedStateLabel(bed.state, lang)}</span>
                      {bed.occupied_now && bed.occupant_gender && <span className="mt-2 block text-xs">{genderLabel(bed.occupant_gender, lang)} · {departureLabel(bed, lang)}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div aria-live="polite" className="mt-6 rounded-xl bg-[#f6f5f1] p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div><p className="text-sm text-slate-600">{lang === "mn" ? "Таны сонголт" : "Your selection"}</p><p className="mt-1 font-semibold text-slate-900">{selectedBedIds.join(", ") || (lang === "mn" ? "Ор сонгоно уу" : "Choose your beds")}</p></div>
                <div><p className="text-sm text-slate-600">{lang === "mn" ? "Өрөөний үнийн нийлбэр" : "Room-rate total"}</p><p className="mt-1 text-xl font-semibold text-slate-900">{nightlyRate === null ? "—" : formatMntAmount((BigInt(nightlyRate) * BigInt(guestCount) * BigInt(policy?.stay_nights ?? 7)).toString())}</p></div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{lang === "mn" ? "Хоол, эмчилгээ болон багцад багтах зүйлсийг хүлээн авалтаас тодруулна уу. Дараагийн алхамд сервер үнэ, хүртээмжийг дахин шалгана." : "Confirm meals, treatments and package inclusions with reception. The next step verifies the price and availability again."}</p>
              {selectionReady ? <Link href={`/booking/summary?${new URLSearchParams({ roomId: selectedRoomId, checkIn, checkOut, gender, bedIds: selectedBedIds.join(",") })}`} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-teal px-5 py-3 text-base font-semibold text-white sm:w-auto">{lang === "mn" ? "4. Хураангуй, нийт үнэ шалгах" : "4. Review your stay & total"}</Link>
                : <button type="button" disabled className="mt-4 min-h-12 w-full rounded-lg bg-slate-200 px-5 py-3 text-base font-semibold text-slate-600 sm:w-auto">{lang === "mn" ? `${guestCount} ор сонгоод үргэлжлүүлнэ үү` : `Select ${guestCount} bed(s) to continue`}</button>}
            </div>
          </section>
        )}
        <BookingFAQ />
      </div>
    </main>
  );
}
