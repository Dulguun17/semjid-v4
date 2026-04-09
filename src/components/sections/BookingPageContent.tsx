"use client";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  CheckCircle, QrCode, Building2, Banknote, Check, Loader2,
  FileText, Info, Users,
} from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { supabase } from "@/lib/supabase";
import { t, rooms, roomInstances, formatMNT, PHONE1, PHONE2 } from "@/lib/data";

type Step = 1 | 2 | 3;
type PayMethod = "qpay" | "card" | "bank" | "cash";
type RoomInfo = { available: boolean; guests: number; bookingCount: number; blocked?: boolean; fullyBooked?: boolean; bedCapacity?: number; genderSummary?: Record<string, number>; guestDetails?: { gender: string; age?: string }[] };
type GuestDetail = { gender: "male" | "female"; age: string };
type BookingForm = {
  fname: string;
  lname: string;
  phone: string;
  email: string;
  checkin: string;
  checkout: string;
  roomId: string;
  guests: string;
  guestDetails: GuestDetail[];
  notes: string;
};

export function BookingPageContent() {
  const { lang } = useLang();
  const [step, setStep] = useState<Step>(1);
  const [done, setDone] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [specialCode, setSpecialCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pay, setPay] = useState<PayMethod>("qpay");

  // Availability state
  const [roomAvailability, setRoomAvailability] = useState<Record<string, RoomInfo>>({});
  const [checkingRoom, setCheckingRoom] = useState<string | null>(null);

  // Ilgeeh bichig state
  const [referralLetterUrl, setReferralLetterUrl] = useState<string>("");
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    new Array((t.booking.sanamj as { mn: string; en: string }[]).length).fill(false)
  );

  const [form, setForm] = useState<BookingForm>({
    fname: "", lname: "", phone: "", email: "",
    checkin: "", checkout: "", roomId: "",
    guests: "2",
    guestDetails: [{ gender: "male", age: "" }, { gender: "male", age: "" }],
    notes: "",
  });

  // Load referral letter URL
  useEffect(() => {
    const loadReferralLetter = async () => {
      try {
        // Try content table first (new system)
        const { data: contentData } = await supabase
          .from("content")
          .select("value")
          .eq("section", "images")
          .eq("key", "referral_letter")
          .eq("lang", lang)
          .single();

        if (contentData?.value) {
          setReferralLetterUrl(contentData.value);
          return;
        }

        // Fallback to settings table (old system)
        const { data: settingsData } = await supabase
          .from("settings")
          .select("referral_letter_url")
          .eq("id", "main")
          .single();

        if (settingsData?.referral_letter_url) {
          setReferralLetterUrl(settingsData.referral_letter_url);
        }
      } catch (error) {
        console.error("Failed to load referral letter:", error);
        // Try settings table as fallback
        try {
          const { data } = await supabase.from("settings").select("referral_letter_url").eq("id", "main").single();
          if (data?.referral_letter_url) {
            setReferralLetterUrl(data.referral_letter_url);
          }
        } catch (fallbackError) {
          console.error("Fallback failed:", fallbackError);
        }
      }
    };
    loadReferralLetter();
  }, [lang]);

  // Calculate min and max dates for booking (today to +3 months)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).toISOString().split('T')[0];

  const normalizeGuestDetails = (count: number, details: GuestDetail[]) => {
    const guestCount = Math.max(1, count);
    const next = [...details];
    while (next.length < guestCount) next.push({ gender: "male", age: "" });
    return next.slice(0, guestCount);
  };

  const set = (k: string, v: string) => setForm(f => {
    const next = { ...f, [k]: v } as BookingForm;
    if (k === "guests") {
      const count = parseInt(v, 10) || 1;
      next.guestDetails = normalizeGuestDetails(count, f.guestDetails);
    }
    if (k === "checkin" && v) {
      // Auto-set checkout to checkin + 7 days
      const checkinDate = new Date(v);
      checkinDate.setDate(checkinDate.getDate() + 7);
      next.checkout = checkinDate.toISOString().split('T')[0];
    }
    return next;
  });

  const setGuestGender = (index: number, gender: "male" | "female") => {
    // Check if this would create mixed genders
    const currentGenders = form.guestDetails.map(g => g.gender);
    currentGenders[index] = gender;
    const hasMale = currentGenders.includes("male");
    const hasFemale = currentGenders.includes("female");

    if (hasMale && hasFemale) {
      // Don't allow mixed genders
      return;
    }

    setForm(f => ({
      ...f,
      guestDetails: f.guestDetails.map((g, i) => i === index ? { ...g, gender } : g),
    }));
  };

  const setGuestAge = (index: number, age: string) => setForm(f => ({
    ...f,
    guestDetails: f.guestDetails.map((g, i) => i === index ? { ...g, age } : g),
  }));

  const selRoom = roomInstances.find(r => r.id === form.roomId);
  const selRoomCategory = selRoom ? rooms.find(r => r.id === selRoom.categoryId) : undefined;
  const nights = useMemo(() => {
    if (!form.checkin) return 0;
    return 7; // Fixed 7-day duration
  }, [form.checkin]);

  const roomPrice = (selRoomCategory?.adult1 ?? selRoomCategory?.adult2 ?? 0) * nights * form.guestDetails.length;
  const total = roomPrice;

  const inp = "w-full bg-slate-50 border border-slate-200 focus:border-teal focus:bg-white outline-none px-4 py-2.5 text-[14px] text-slate-700 rounded-lg transition-colors";
  const lbl = "text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5";

  // ── Availability ────────────────────────────────────────────────────────────
  const checkRoomAvailability = useCallback(async (roomId: string, checkin: string, checkout: string) => {
    setCheckingRoom(roomId);
    try {
      const res = await fetch(`/api/availability?roomId=${roomId}&checkin=${checkin}&checkout=${checkout}`);
      const data = await res.json();
      setRoomAvailability(prev => ({ ...prev, [roomId]: data }));
    } catch {
      setRoomAvailability(prev => ({ ...prev, [roomId]: { available: true, guests: 0, bookingCount: 0 } }));
    } finally {
      setCheckingRoom(null);
    }
  }, []);

  const checkAllRooms = useCallback((checkin: string, checkout: string) => {
    setRoomAvailability({});
    roomInstances.forEach(r => checkRoomAvailability(r.id, checkin, checkout));
  }, [checkRoomAvailability]);
  // ───────────────────────────────────────────────────────────────────────────

  const toggleCheck = (i: number) => {
    setCheckedItems(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Validate all required fields
      if (!form.fname?.trim()) throw new Error(lang === "mn" ? "Нэрийг оруулна уу" : "First name is required");
      if (!form.lname?.trim()) throw new Error(lang === "mn" ? "Овог оруулна уу" : "Last name is required");
      if (!form.phone?.trim()) throw new Error(lang === "mn" ? "Утасны дугаарыг оруулна уу" : "Phone is required");
      if (!form.email?.trim()) throw new Error(lang === "mn" ? "И-мэйлийг оруулна уу" : "Email is required");
      if (!form.checkin) throw new Error(lang === "mn" ? "Ирэх огнооны оруулна уу" : "Check-in date is required");
      if (!form.checkout) throw new Error(lang === "mn" ? "Явах огнооны оруулна уу" : "Check-out date is required");
      if (!form.roomId?.trim()) throw new Error(lang === "mn" ? "Өрөө сонгоно уу" : "Please select a room");

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) throw new Error(lang === "mn" ? "И-мэйлийн формат буруу байна" : "Invalid email format");

      console.log("Starting payment submission with:", {
        fname: form.fname,
        lname: form.lname,
        phone: form.phone,
        email: form.email,
        checkin: form.checkin,
        checkout: form.checkout,
        roomId: form.roomId,
        guests: form.guests,
        payment: pay,
        total,
      });

      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...form, 
          payment: pay, 
          total,
          guests: parseInt(form.guests) || 1,
        }),
      });
      
      const data = await res.json();
      console.log("API Response:", { status: res.status, data });

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      if (!data.ref) {
        throw new Error("No booking reference received from server");
      }

      console.log("✅ Booking successful:", data);
      setBookingRef(data.ref);
      setSpecialCode(data.specialCode || "");
      setDone(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Booking error:", errorMsg);
      setError(errorMsg || (lang === "mn" ? "Захиалга илгээхэд алдаа гарлаа. Дахин оролдоно уу." : "Failed to submit. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 pt-20">
      <div className="text-center max-w-md bg-white rounded-2xl p-10 shadow-sm">
        <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-teal" />
        </div>
        <h2 className="font-serif text-2xl text-slate-800 mb-3">{t.booking.success[lang]}</h2>
        <p className="text-[13px] text-slate-400 mb-2">
          {lang === "mn" ? "Захиалгын дугаар:" : "Booking ref:"}{" "}
          <strong className="text-teal">{bookingRef}</strong>
        </p>
        {specialCode && (
          <p className="text-[13px] text-slate-400 mb-2">
            {lang === "mn" ? "Тусгай код:" : "Special code:"}{" "}
            <strong className="text-teal text-lg">{specialCode}</strong>
          </p>
        )}
        <p className="text-[13px] text-slate-400 mb-2">
          {t.booking.specialCodeSent[lang]}
        </p>
        <p className="text-[13px] text-slate-400 mb-6">{PHONE1} / {PHONE2}</p>
        <button onClick={() => { setDone(false); setStep(1); }} className="text-[13px] text-teal border-b border-teal/30 cursor-pointer">
          {lang === "mn" ? "Буцах" : "Back"}
        </button>
      </div>
    </div>
  );

  const sanamjItems = t.booking.sanamj as { mn: string; en: string }[];

  // 3-step flow now
  const steps = [
    { n: 1, l: t.booking.s1 },
    { n: 2, l: t.booking.s2 },
    { n: 3, l: t.booking.s3 },
  ] as const;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-teal py-14 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] tracking-[0.25em] uppercase text-teal-light mb-2">{t.booking.badge[lang]}</p>
          <h1 className="font-serif text-[clamp(28px,4vw,52px)] text-white">{t.booking.title[lang]}</h1>
          <p className="text-[14px] text-white/55 mt-2">{t.booking.sub[lang]}</p>
        </div>
      </div>

      <div className="bg-white border-b border-slate-100 px-6 lg:px-10 py-4 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div
                onClick={() => step > s.n && setStep(s.n as Step)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold cursor-pointer transition-all ${step === s.n ? "bg-teal text-white shadow-lg shadow-teal/30" : step > s.n ? "bg-teal/20 text-teal" : "bg-slate-100 text-slate-400"}`}
              >
                {step > s.n ? <Check size={14} /> : s.n}
              </div>
              <span className={`text-[12px] hidden sm:block ${step >= s.n ? "text-slate-700" : "text-slate-300"}`}>{s.l[lang]}</span>
              {i < 2 && <div className={`w-8 h-px mx-1 ${step > s.n ? "bg-teal/40" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

          {/* STEP 1 — Personal info + Илгээх бичиг + Санамж */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Personal info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-serif text-xl text-slate-800 mb-6">{t.booking.s1[lang]}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {[[t.booking.fname,"fname","text"],[t.booking.lname,"lname","text"],[t.booking.phone,"phone","tel"],[t.booking.email,"email","email"]].map(([label,key,type]) => (
                    <div key={key as string}>
                      <label className={lbl}>{(label as {mn:string;en:string})[lang]}</label>
                      <input type={type as string} value={(form as unknown as Record<string,string>)[key as string]} onChange={e=>set(key as string,e.target.value)} className={inp}/>
                    </div>
                  ))}
                  <div>
                    <label className={lbl}>{t.booking.checkin[lang]}</label>
                    <input type="date" value={form.checkin} min={minDate} max={maxDate} onChange={e=>set("checkin",e.target.value)} className={inp}/>
                    <p className="text-[10px] text-slate-500 mt-1">{lang === "mn" ? "3 сарын дараа хүртэл захиалах боломжтой" : "Can book up to 3 months in advance"}</p>
                  </div>
                  <div>
                    <label className={lbl}>{t.booking.checkout[lang]}</label>
                    <input type="text" value={form.checkout ? new Date(form.checkout).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US") : ""} readOnly className={inp + " bg-slate-100 cursor-not-allowed"}/>
                  </div>
                </div>
                <div className="mb-2">
                  <label className={lbl}>{t.booking.numGuests[lang]}</label>
                  <select value={form.guests} onChange={e=>set("guests",e.target.value)} className={inp}>
                    {["1","2","3","4","5"].map(n=><option key={n}>{n}</option>)}
                  </select>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <h3 className="text-[12px] font-semibold text-slate-600 uppercase tracking-[0.18em] mb-3">{t.booking.guestInfo[lang]}</h3>
                  <div className="space-y-3">
                    {form.guestDetails.map((guest, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className={lbl}>{`${t.booking.guestN[lang]} ${index + 1}`}</label>
                          <input value={`${index + 1}`} disabled className={inp + " bg-slate-100 cursor-not-allowed"} />
                        </div>
                        <div>
                          <label className={lbl}>{t.booking.genderLabel[lang]}</label>
                          <select value={guest.gender} onChange={e=>setGuestGender(index, e.target.value as "male" | "female")} className={inp}>
                            <option value="male">{t.booking.male[lang]}</option>
                            <option value="female">{t.booking.female[lang]}</option>
                          </select>
                          {(() => {
                            const hasMale = form.guestDetails.some(g => g.gender === "male");
                            const hasFemale = form.guestDetails.some(g => g.gender === "female");
                            return hasMale && hasFemale ? (
                              <p className="text-[10px] text-red-500 mt-1">{lang === "mn" ? "Эрэгтэй, эмэгтэй зэрэг байрлах боломжгүй" : "Mixed genders not allowed"}</p>
                            ) : null;
                          })()}
                        </div>
                        <div>
                          <label className={lbl}>{t.booking.ageLabel[lang]}</label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={guest.age}
                            onChange={e=>setGuestAge(index, e.target.value)}
                            placeholder="25"
                            className={inp}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Илгээх бичиг */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-3 mb-2">
                  <FileText size={22} className="text-teal mt-0.5 shrink-0" />
                  <div>
                    <h2 className="font-serif text-xl text-slate-800">{t.booking.ilgeeh.title[lang]}</h2>
                    <p className="text-[13px] text-slate-400 mt-1">{t.booking.ilgeeh.sub[lang]}</p>
                  </div>
                </div>
                <div className="mt-5">
                  {referralLetterUrl ? (
                    <a
                      href={referralLetterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 bg-teal text-white px-6 py-4 rounded-xl hover:bg-teal-dark transition-colors cursor-pointer"
                    >
                      <FileText size={20} />
                      <span className="font-medium">{t.booking.ilgeeh.download[lang]}</span>
                    </a>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <FileText size={36} className="mx-auto mb-3 text-slate-200"/>
                      <p className="text-[13px]">Файл байхгүй</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Санамж checklist */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400"/>
                  <h2 className="font-serif text-xl text-slate-800">{lang==="mn"?"САНАМЖ":"NOTICE"}</h2>
                </div>
                <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-5 leading-relaxed">
                  {t.booking.ilgeeh.sanamjTitle[lang]}
                </p>
                <div className="space-y-3">
                  {sanamjItems.map((item, i) => (
                    <div key={i} onClick={()=>toggleCheck(i)} className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none ${checkedItems[i]?"border-teal/30 bg-teal/5":"border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${checkedItems[i]?"border-teal bg-teal":"border-slate-300"}`}>
                        {checkedItems[i]&&<Check size={11} className="text-white"/>}
                      </div>
                      <p className={`text-[13px] leading-relaxed transition-colors ${checkedItems[i]?"text-slate-400 line-through":"text-slate-700"}`}>
                        <span className="font-semibold text-teal mr-1 no-underline" style={{textDecoration:"none"}}>{i+1}.</span>
                        {item[lang]}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] text-slate-400">
                      {lang==="mn"?`${checkedItems.filter(Boolean).length}/${sanamjItems.length} зүйл уншсан`:`${checkedItems.filter(Boolean).length}/${sanamjItems.length} items acknowledged`}
                    </span>
                    {checkedItems.every(Boolean)&&(
                      <span className="text-[11px] text-teal font-semibold flex items-center gap-1">
                        <Check size={12}/>{lang==="mn"?"Бүгдийг уншсан":"All acknowledged"}
                      </span>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal rounded-full transition-all duration-500" style={{width:`${(checkedItems.filter(Boolean).length/sanamjItems.length)*100}%`}}/>
                  </div>
                </div>
              </div>

              {error && <p className="text-red-500 text-[12px]">{error}</p>}
              <button
                onClick={() => {
                  if (!form.fname||!form.lname||!form.phone||!form.checkin||!form.checkout) {
                    setError(lang==="mn"?"Заавал талбаруудыг бөглөнө үү.":"Please fill required fields.");
                    return;
                  }
                  setError("");
                  checkAllRooms(form.checkin, form.checkout);
                  setStep(2);
                }}
                className="text-[13px] font-medium bg-teal hover:bg-teal-dark text-white px-8 py-3 rounded-lg transition-colors cursor-pointer"
              >
                {t.booking.next[lang]}
              </button>
            </div>
          )}

          {/* STEP 2 — Өрөө & Эмчилгээ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-serif text-xl text-slate-800">{t.rooms.title[lang]}</h2>
                  <button
                    onClick={() => checkAllRooms(form.checkin, form.checkout)}
                    className="text-[11px] text-teal border border-teal/30 px-3 py-1.5 rounded-lg hover:bg-teal/5 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Loader2 size={11} className={checkingRoom ? "animate-spin" : ""} />
                    {lang === "mn" ? "Дахин шалгах" : "Recheck"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roomInstances.map(r => {
                    const category = rooms.find(cat => cat.id === r.categoryId);
                    const price = category?.adult1 ?? category?.adult2 ?? 0;
                    const sel = form.roomId === r.id;
                    const roomInfo = roomAvailability[r.id] ?? { available: true, guests: 0, bookingCount: 0, bedCapacity: r.beds || 1 };
                    const isChecking = checkingRoom === r.id;
                    const hasChecked = r.id in roomAvailability;
                    const isUnavailable = hasChecked && (!roomInfo.available || roomInfo.blocked || roomInfo.fullyBooked);
                    const genderSummary = roomInfo.genderSummary;
                    const guestDetails = roomInfo.guestDetails || [];
                    const bedCapacity = roomInfo.bedCapacity || r.beds || 1;
                    const summaryText = guestDetails.length > 0 ? guestDetails
                      .map(guest => {
                        const genderLabel = guest.gender === "male" ? t.booking.male[lang] : guest.gender === "female" ? t.booking.female[lang] : guest.gender;
                        return guest.age ? `${genderLabel} (${guest.age})` : genderLabel;
                      }).join(", ") : null;

                    return (
                      <div
                        key={r.id}
                        onClick={() => { if (isUnavailable) return; set("roomId", r.id); }}
                        className={`border-2 rounded-xl overflow-hidden transition-all ${isUnavailable ? "border-red-200 opacity-70 cursor-not-allowed" : sel ? "border-teal shadow-lg shadow-teal/10 cursor-pointer" : "border-slate-100 hover:border-slate-200 cursor-pointer"}`}
                      >
                        <div className="relative h-28 overflow-hidden bg-slate-100">
                          <div className="absolute inset-0 bg-slate-200/50" />
                          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-900/80 to-transparent" />
                          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                            #{r.number}
                          </div>
                          <div className="absolute left-3 bottom-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                            {r.type[lang]} · {r.beds ?? "—"} {lang === "mn" ? "ор" : "beds"}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="text-[13px] font-medium text-slate-700">{r.desc[lang]}</div>
                          <div className="text-[12px] text-teal font-semibold mt-2">{formatMNT(price)} {lang === "mn" ? "хүн/шөнө" : "per person/night"}</div>
                          {summaryText && (
                            <div className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700">
                              {lang === "mn" ? "Одоогийн зочид:" : "Current guests:"} {summaryText}
                            </div>
                          )}
                          {hasChecked && !isChecking && (
                            <div className={`mt-3 pt-3 border-t flex items-center gap-1.5 ${isUnavailable ? "border-red-100" : "border-slate-100"}`}>
                              <Users size={10} className={isUnavailable ? "text-red-400" : "text-green-500"} />
                              {roomInfo.fullyBooked ? (
                                <span className="text-[10px] text-red-400">
                                  {lang === "mn" ? `Дүүрэн захиалагдсан (${roomInfo.guests}/${bedCapacity})` : `Fully booked (${roomInfo.guests}/${bedCapacity})`}
                                </span>
                              ) : roomInfo.blocked ? (
                                <span className="text-[10px] text-red-400">
                                  {lang === "mn" ? "Хаалттай" : "Blocked"}
                                </span>
                              ) : (
                                <span className="text-[10px] text-green-600">
                                  {lang === "mn" ? `Захиалах боломжтой (${roomInfo.guests}/${bedCapacity})` : `Available (${roomInfo.guests}/${bedCapacity})`}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-serif text-xl text-slate-800 mb-3">{lang === "mn" ? "Эмчилгээний үйлчилгээ" : "Treatment Services"}</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-[12px] text-blue-700 leading-relaxed">
                      {lang === "mn" 
                        ? "Өрөө захиалахад эмчилгээний үйлчилгээ багтсан байна. Ирсний дараа мэргэжлийн эмч шинжилгээ хийж, өвчний байдлаас хамааран тохирсон эмчилгээг зохион байгуулна."
                        : "Treatment services are included with your room booking. Upon arrival, our medical team will assess each guest and provide treatment based on their condition."
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <label className={lbl}>{t.booking.notes[lang]}</label>
                <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3} className={inp+" resize-none"}/>
              </div>

              {error && <p className="text-red-500 text-[12px]">{error}</p>}
              <div className="flex gap-3">
                <button onClick={()=>setStep(1)} className="text-[13px] text-slate-500 border border-slate-200 px-6 py-3 rounded-lg cursor-pointer">{t.booking.back[lang]}</button>
                <button
                  onClick={() => {
                    if (!form.roomId) { setError(lang==="mn"?"Өрөө сонгоно уу.":"Please select a room."); return; }
                    setError(""); setStep(3);
                  }}
                  className="text-[13px] font-medium bg-teal text-white px-8 py-3 rounded-lg cursor-pointer"
                >
                  {t.booking.next[lang]}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Төлбөр */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-serif text-xl text-slate-800 mb-5">{t.booking.payTitle[lang]}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {([["qpay",QrCode,t.booking.qpay],["card",QrCode,t.booking.card],["bank",Building2,t.booking.bank],["cash",Banknote,t.booking.cash]] as const).map(([id,Icon,label]) => (
                    <div key={id} onClick={()=>setPay(id)} className={`p-4 border-2 rounded-xl cursor-pointer text-center transition-all ${pay===id?"border-teal bg-teal/5":"border-slate-100 hover:border-slate-200"}`}>
                      <Icon size={22} className={`mx-auto mb-1.5 ${pay===id?"text-teal":"text-slate-300"}`}/>
                      <div className={`text-[11px] font-medium ${pay===id?"text-teal":"text-slate-400"}`}>{(label as {mn:string;en:string})[lang]}</div>
                    </div>
                  ))}
                </div>
                {pay==="bank"&&(<div className="border border-slate-100 rounded-xl p-5 bg-slate-50"><h3 className="text-[13px] font-semibold text-slate-700 mb-3">{lang==="mn"?"Дансны мэдээлэл":"Bank Account Details"}</h3>{[[lang==="mn"?"Хүлээн авагч":"Recipient","Батмөнх Цэрэнханд"],[lang==="mn"?"Данс":"Account","08 0005 00 557333756 (Хаан Банк)"],[lang==="mn"?"Утга":"Reference",t.booking.bankRef[lang]],[lang==="mn"?"Дүн":"Amount",formatMNT(total)]].map(([k,v]) => (<div key={k} className="flex justify-between py-2 border-b border-slate-100 last:border-0"><span className="text-[12px] text-slate-400">{k}</span><span className="text-[12px] font-medium text-slate-700">{v}</span></div>))}</div>)}
                {(pay==="card"||pay==="cash")&&(<div className="border border-slate-100 rounded-xl p-5 bg-slate-50 text-center"><p className="text-[14px] text-slate-500">{pay==="card"?(lang==="mn"?"Ирэх үедээ картаар төлнө үү.":"Pay by card on arrival."):(lang==="mn"?"Ирэх үедээ бэлэн мөнгөөр төлнө үү.":"Pay in cash upon arrival.")}</p></div>)}
              </div>

              {error&&<div className="bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-lg px-4 py-3">{error}</div>}
              <div className="flex gap-3">
                <button onClick={()=>setStep(2)} className="text-[13px] text-slate-500 border border-slate-200 px-6 py-3 rounded-lg cursor-pointer">{t.booking.back[lang]}</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 text-[13px] font-medium bg-teal hover:bg-teal-dark text-white py-3 rounded-lg cursor-pointer transition-colors disabled:opacity-60"
                >
                  {loading?<><Loader2 size={14} className="animate-spin"/>{lang==="mn"?"Илгээж байна...":"Submitting..."}</>:t.booking.submit[lang]}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-32">
            <h3 className="font-serif text-[17px] text-slate-800 mb-4">{t.booking.summary[lang]}</h3>
            {selRoom && selRoomCategory ? (<><div className="relative h-28 rounded-lg overflow-hidden mb-3"><Image src={selRoomCategory.img} alt={`${selRoom.type[lang]} ${selRoom.number}`} fill className="object-cover"/></div><div className="flex justify-between mb-1"><span className="text-[13px] text-slate-500">{`${selRoom.type[lang]} ${selRoom.number}`}</span><span className="text-[13px] font-medium text-slate-700">{formatMNT(selRoomCategory.adult1 ?? selRoomCategory.adult2 ?? 0)} × {form.guestDetails.length} × {nights} = {formatMNT(roomPrice)}</span></div></>) : <p className="text-[13px] text-slate-300 mb-3">{t.booking.noRoom[lang]}</p>}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="text-[13px] text-slate-500 mb-2">{t.booking.guestInfo[lang]}</div>
              <div className="space-y-1">
                {form.guestDetails.map((guest, index) => (
                  <div key={index} className="flex items-center justify-between text-[12px] text-slate-600">
                    <span>{`${t.booking.guestN[lang]} ${index + 1}`}</span>
                    <span>{guest.gender === "male" ? t.booking.male[lang] : t.booking.female[lang]}{guest.age ? `, ${guest.age}` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center">
              <span className="text-[13px] text-slate-500">{t.booking.total[lang]}</span>
              <span className="font-serif text-xl text-teal">{formatMNT(total)}</span>
            </div>
            {nights>0&&<p className="text-[11px] text-slate-300 mt-1 text-right">{nights} {t.booking.nights[lang]}</p>}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 mb-1">{lang==="mn"?"Захиалгын утас:":"Hotline:"}</p>
              <a href={`tel:${PHONE1.replace(/-/g,"")}`} className="text-[15px] font-semibold text-teal no-underline block">{PHONE1}</a>
              <a href={`tel:${PHONE2.replace(/-/g,"")}`} className="text-[14px] text-teal/70 no-underline block">{PHONE2}</a>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 bg-teal/5 rounded-lg p-3">
              <p className="text-[11px] text-teal leading-relaxed">{t.booking.childInfo[lang]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
