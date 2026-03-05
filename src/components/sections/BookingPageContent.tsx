"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import { CheckCircle, QrCode, Building2, Banknote, Check, Loader2 } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, rooms, services, formatMNT, PHONE1, PHONE2 } from "@/lib/data";

type Step = 1 | 2 | 3;
type PayMethod = "qpay" | "card" | "bank" | "cash";

export function BookingPageContent() {
  const { lang } = useLang();
  const [step, setStep] = useState<Step>(1);
  const [done, setDone] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pay, setPay] = useState<PayMethod>("qpay");
  const [form, setForm] = useState({
    fname:"", lname:"", phone:"", email:"",
    checkin:"", checkout:"", roomId:"",
    svcIds:[] as string[], guests:"2", notes:"",
  });

  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}));
  const toggleSvc = (id: string) => setForm(f => ({
    ...f, svcIds: f.svcIds.includes(id) ? f.svcIds.filter(s=>s!==id) : [...f.svcIds, id]
  }));

  const selRoom = rooms.find(r => r.id === form.roomId);
  const nights = useMemo(() => {
    if (!form.checkin || !form.checkout) return 0;
    return Math.max(0, Math.round((new Date(form.checkout).getTime() - new Date(form.checkin).getTime()) / 86400000));
  }, [form.checkin, form.checkout]);

  const roomPrice = (selRoom?.adult2 ?? selRoom?.adult1 ?? 0) * nights;
  const svcPrice = form.svcIds.reduce((s, id) => s + (services.find(sv=>sv.id===id)?.price??0), 0);
  const total = roomPrice + svcPrice;

  const inp = "w-full bg-slate-50 border border-slate-200 focus:border-teal focus:bg-white outline-none px-4 py-2.5 text-[14px] text-slate-700 rounded-lg transition-colors";
  const lbl = "text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5";

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, payment: pay, total }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBookingRef(data.ref);
      setDone(true);
    } catch {
      setError(lang === "mn" ? "Захиалга илгээхэд алдаа гарлаа. Дахин оролдоно уу." : "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 pt-20">
      <div className="text-center max-w-md bg-white rounded-2xl p-10 shadow-sm">
        <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-teal"/>
        </div>
        <h2 className="font-serif text-2xl text-slate-800 mb-3">{t.booking.success[lang]}</h2>
        <p className="text-[13px] text-slate-400 mb-2">{lang==="mn"?"Захиалгын дугаар:":"Booking ref:"} <strong className="text-teal">{bookingRef}</strong></p>
        <p className="text-[13px] text-slate-400 mb-6">{PHONE1} / {PHONE2}</p>
        <button onClick={()=>{setDone(false);setStep(1);}} className="text-[13px] text-teal border-b border-teal/30 cursor-pointer">{lang==="mn"?"Буцах":"Back"}</button>
      </div>
    </div>
  );

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
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          {([{n:1,l:t.booking.s1},{n:2,l:t.booking.s2},{n:3,l:t.booking.s3}] as const).map((s,i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div onClick={() => step > s.n && setStep(s.n as Step)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold cursor-pointer transition-all ${step===s.n?"bg-teal text-white shadow-lg shadow-teal/30":step>s.n?"bg-teal/20 text-teal":"bg-slate-100 text-slate-400"}`}>
                {step>s.n?<Check size={14}/>:s.n}
              </div>
              <span className={`text-[12px] hidden sm:block ${step>=s.n?"text-slate-700":"text-slate-300"}`}>{s.l[lang]}</span>
              {i<2&&<div className={`w-10 h-px mx-1 ${step>s.n?"bg-teal/40":"bg-slate-200"}`}/>}
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step===1 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-serif text-xl text-slate-800 mb-6">{t.booking.s1[lang]}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {[[t.booking.fname,"fname","text"],[t.booking.lname,"lname","text"],[t.booking.phone,"phone","tel"],[t.booking.email,"email","email"],[t.booking.checkin,"checkin","date"],[t.booking.checkout,"checkout","date"]].map(([label,key,type]) => (
                  <div key={key as string}>
                    <label className={lbl}>{(label as {mn:string;en:string})[lang]}</label>
                    <input type={type as string} value={(form as unknown as Record<string,string>)[key as string]} onChange={e=>set(key as string,e.target.value)} className={inp}/>
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <label className={lbl}>{t.booking.numGuests[lang]}</label>
                <select value={form.guests} onChange={e=>set("guests",e.target.value)} className={inp}>
                  {["1","2","3","4","5"].map(n=><option key={n}>{n}</option>)}
                </select>
              </div>
              {error && <p className="text-red-500 text-[12px] mb-3">{error}</p>}
              <button onClick={()=>{if(!form.fname||!form.lname||!form.phone||!form.checkin||!form.checkout){setError(lang==="mn"?"Заавал талбаруудыг бөглөнө үү.":"Please fill required fields.");return;}setError("");setStep(2);}} className="text-[13px] font-medium bg-teal hover:bg-teal-dark text-white px-8 py-3 rounded-lg transition-colors cursor-pointer">{t.booking.next[lang]}</button>
            </div>
          )}
          {step===2 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-serif text-xl text-slate-800 mb-5">{t.rooms.title[lang]}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rooms.map(r => {
                    const price = r.adult2??r.adult1??0; const sel = form.roomId===r.id;
                    return (<div key={r.id} onClick={()=>set("roomId",r.id)} className={`border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${sel?"border-teal shadow-lg shadow-teal/10":"border-slate-100 hover:border-slate-200"}`}><div className="relative h-32 overflow-hidden"><Image src={r.img} alt={r.name[lang]} fill className="object-cover"/>{sel&&<div className="absolute top-2 right-2 w-6 h-6 bg-teal rounded-full flex items-center justify-center"><Check size={12} className="text-white"/></div>}</div><div className="p-3"><div className="text-[13px] font-medium text-slate-700">{r.name[lang]}</div><div className="text-[12px] text-teal font-semibold mt-0.5">{formatMNT(price)}{t.rooms.night[lang]}</div></div></div>);
                  })}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-serif text-xl text-slate-800 mb-5">{t.booking.addTreat[lang]}</h2>
                <div className="space-y-2">
                  {services.map(s => { const sel = form.svcIds.includes(s.id); return (<div key={s.id} onClick={()=>toggleSvc(s.id)} className={`flex items-center justify-between p-3.5 border rounded-lg cursor-pointer transition-all ${sel?"border-teal bg-teal/4":"border-slate-100 hover:border-slate-200"}`}><div className="flex items-center gap-3"><div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${sel?"border-teal bg-teal":"border-slate-200"}`}>{sel&&<Check size={11} className="text-white"/>}</div><div><div className="text-[13px] font-medium text-slate-700">{s.name[lang]}</div><div className="text-[11px] text-slate-400">{s.duration}</div></div></div><span className="text-[13px] font-semibold text-teal shrink-0">{formatMNT(s.price)}</span></div>); })}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <label className={lbl}>{t.booking.notes[lang]}</label>
                <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3} className={inp+" resize-none"}/>
              </div>
              {error && <p className="text-red-500 text-[12px]">{error}</p>}
              <div className="flex gap-3">
                <button onClick={()=>setStep(1)} className="text-[13px] text-slate-500 border border-slate-200 px-6 py-3 rounded-lg cursor-pointer">{t.booking.back[lang]}</button>
                <button onClick={()=>{if(!form.roomId){setError(lang==="mn"?"Өрөө сонгоно уу.":"Please select a room.");return;}setError("");setStep(3);}} className="text-[13px] font-medium bg-teal text-white px-8 py-3 rounded-lg cursor-pointer">{t.booking.next[lang]}</button>
              </div>
            </div>
          )}
          {step===3 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-serif text-xl text-slate-800 mb-5">{t.booking.payTitle[lang]}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {([["qpay",QrCode,t.booking.qpay],["card",QrCode,t.booking.card],["bank",Building2,t.booking.bank],["cash",Banknote,t.booking.cash]] as const).map(([id,Icon,label]) => (<div key={id} onClick={()=>setPay(id)} className={`p-4 border-2 rounded-xl cursor-pointer text-center transition-all ${pay===id?"border-teal bg-teal/5":"border-slate-100 hover:border-slate-200"}`}><Icon size={22} className={`mx-auto mb-1.5 ${pay===id?"text-teal":"text-slate-300"}`}/><div className={`text-[11px] font-medium ${pay===id?"text-teal":"text-slate-400"}`}>{(label as {mn:string;en:string})[lang]}</div></div>))}
                </div>
                {pay==="bank" && (<div className="border border-slate-100 rounded-xl p-5 bg-slate-50"><h3 className="text-[13px] font-semibold text-slate-700 mb-3">{lang==="mn"?"Дансны мэдээлэл":"Bank Account Details"}</h3>{[[lang==="mn"?"Хүлээн авагч":"Recipient","Батмөнх Цэрэнханд"],[lang==="mn"?"Данс":"Account","08 0005 00 557333756 (Хаан Банк)"],[lang==="mn"?"Утга":"Reference",t.booking.bankRef[lang]],[lang==="mn"?"Дүн":"Amount",formatMNT(total)]].map(([k,v]) => (<div key={k} className="flex justify-between py-2 border-b border-slate-100 last:border-0"><span className="text-[12px] text-slate-400">{k}</span><span className="text-[12px] font-medium text-slate-700">{v}</span></div>))}</div>)}
                {(pay==="card"||pay==="cash") && (<div className="border border-slate-100 rounded-xl p-5 bg-slate-50 text-center"><p className="text-[14px] text-slate-500">{pay==="card"?(lang==="mn"?"Ирэх үедээ картаар төлнө үү.":"Pay by card on arrival."):(lang==="mn"?"Ирэх үедээ бэлэн мөнгөөр төлнө үү.":"Pay in cash upon arrival.")}</p></div>)}
              </div>
              {error && <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-lg px-4 py-3">{error}</div>}
              <div className="flex gap-3">
                <button onClick={()=>setStep(2)} className="text-[13px] text-slate-500 border border-slate-200 px-6 py-3 rounded-lg cursor-pointer">{t.booking.back[lang]}</button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 text-[13px] font-medium bg-teal hover:bg-teal-dark text-white py-3 rounded-lg cursor-pointer transition-colors disabled:opacity-60">
                  {loading?<><Loader2 size={14} className="animate-spin"/>{lang==="mn"?"Илгээж байна...":"Submitting..."}</>:t.booking.submit[lang]}
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-32">
            <h3 className="font-serif text-[17px] text-slate-800 mb-4">{t.booking.summary[lang]}</h3>
            {selRoom?(<><div className="relative h-28 rounded-lg overflow-hidden mb-3"><Image src={selRoom.img} alt={selRoom.name[lang]} fill className="object-cover"/></div><div className="flex justify-between mb-1"><span className="text-[13px] text-slate-500">{selRoom.name[lang]}</span><span className="text-[13px] font-medium text-slate-700">{formatMNT(selRoom.adult2??selRoom.adult1??0)} ×{nights}</span></div></>):<p className="text-[13px] text-slate-300 mb-3">{t.booking.noRoom[lang]}</p>}
            {form.svcIds.length>0&&(<div className="border-t border-slate-100 pt-3 space-y-1.5 mt-2">{form.svcIds.map(id=>{const s=services.find(sv=>sv.id===id);return s?<div key={id} className="flex justify-between"><span className="text-[12px] text-slate-400">{s.name[lang]}</span><span className="text-[12px] text-slate-600">{formatMNT(s.price)}</span></div>:null;})}</div>)}
            <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center"><span className="text-[13px] text-slate-500">{t.booking.total[lang]}</span><span className="font-serif text-xl text-teal">{formatMNT(total)}</span></div>
            {nights>0&&<p className="text-[11px] text-slate-300 mt-1 text-right">{nights} {t.booking.nights[lang]}</p>}
            <div className="mt-4 pt-4 border-t border-slate-100"><p className="text-[11px] text-slate-400 mb-1">{lang==="mn"?"Захиалгын утас:":"Hotline:"}</p><a href={`tel:${PHONE1.replace(/-/g,"")}`} className="text-[15px] font-semibold text-teal no-underline block">{PHONE1}</a><a href={`tel:${PHONE2.replace(/-/g,"")}`} className="text-[14px] text-teal/70 no-underline block">{PHONE2}</a></div>
            <div className="mt-3 pt-3 border-t border-slate-100 bg-teal/5 rounded-lg p-3"><p className="text-[11px] text-teal leading-relaxed">{t.booking.childInfo[lang]}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
