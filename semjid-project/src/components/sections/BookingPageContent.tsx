"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import { CheckCircle, QrCode, Banknote, Phone } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, rooms, services, formatMNT, PHONE1, PHONE2 } from "@/lib/data";

export function BookingPageContent() {
  const { lang } = useLang();
  const [step, setStep] = useState<1|2|3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [payMethod, setPayMethod] = useState<"qpay"|"bank"|"cash">("qpay");
  const [form, setForm] = useState({
    firstName:"", lastName:"", phone:"", email:"",
    checkIn:"", checkOut:"", room:"",
    selectedServices:[] as string[],
    guests:"1", notes:"",
  });

  const ch = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const toggleSvc = (id:string) => setForm(f=>({
    ...f,
    selectedServices: f.selectedServices.includes(id)
      ? f.selectedServices.filter(s=>s!==id)
      : [...f.selectedServices, id],
  }));

  const selectedRoom = rooms.find(r=>r.id===form.room);
  const nights = useMemo(()=>{
    if(!form.checkIn||!form.checkOut) return 0;
    const d = new Date(form.checkOut).getTime()-new Date(form.checkIn).getTime();
    return Math.max(0,Math.round(d/86400000));
  },[form.checkIn,form.checkOut]);

  const roomPrice = selectedRoom ? (selectedRoom.priceBuilding2??selectedRoom.priceBuilding1??0) : 0;
  const roomTotal = roomPrice * nights * parseInt(form.guests);
  const svcTotal  = form.selectedServices.reduce((s,id)=>s+(services.find(sv=>sv.id===id)?.price??0),0);
  const total = roomTotal + svcTotal;

  if(submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6 pt-28">
      <div className="text-center max-w-md bg-white border border-primary/15 p-12 shadow-sm">
        <CheckCircle size={52} className="text-primary mx-auto mb-6" />
        <h2 className="font-display text-2xl font-semibold text-deep mb-3">{t.booking.success[lang]}</h2>
        <div className="font-body text-sm text-steel mb-6">
          {lang === "mn" ? "Захиалгын дугаар" : "Booking ref"}: <strong>#SKH-{Math.floor(Math.random()*9000+1000)}</strong>
        </div>
        <div className="flex flex-col gap-2 mb-6">
          <a href={`tel:+976${PHONE1.replace(/-/g,"")}`} className="font-body text-sm text-primary no-underline cursor-none flex items-center justify-center gap-2">
            <Phone size={13}/> {PHONE1}
          </a>
          <a href={`tel:+976${PHONE2.replace(/-/g,"")}`} className="font-body text-sm text-primary no-underline cursor-none flex items-center justify-center gap-2">
            <Phone size={13}/> {PHONE2}
          </a>
        </div>
        <button onClick={()=>setSubmitted(false)} className="font-body text-[11px] tracking-widest uppercase text-primary border-b border-primary/30 cursor-none">
          {lang === "mn" ? "Буцах" : "Go Back"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="pt-28 bg-white min-h-screen">
      {/* Header */}
      <div className="ornament-bg border-b border-primary/10 py-10 px-6 lg:px-14 text-center">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-[clamp(26px,4vw,50px)] font-semibold text-primary uppercase tracking-wide mb-2">{t.booking.title[lang]}</h1>
          <div className="w-12 h-0.5 bg-primary mx-auto mb-3" />
          <p className="font-body text-xs text-steel max-w-md mx-auto">{t.booking.subtitle[lang]}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-cream border-b border-primary/10 px-6 lg:px-14 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          {[
            { n:1, l:{mn:"Мэдээлэл",en:"Details"} },
            { n:2, l:{mn:"Өрөө & Үйлчилгээ",en:"Room & Services"} },
            { n:3, l:{mn:"Төлбөр",en:"Payment"} },
          ].map((s,i)=>(
            <div key={s.n} className="flex items-center gap-2 cursor-none" onClick={()=>setStep(s.n as 1|2|3)}>
              <div className={`w-7 h-7 flex items-center justify-center text-xs font-medium transition-colors ${step>=s.n ? "bg-primary text-white" : "bg-steel/20 text-steel"}`}>{s.n}</div>
              <span className={`font-body text-xs hidden sm:block ${step>=s.n ? "text-primary" : "text-steel"}`}>{s.l[lang]}</span>
              {i<2 && <div className="w-8 h-px bg-primary/20" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-14 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">

          {/* STEP 1 */}
          {step===1 && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-deep mb-6">{lang==="mn"?"Хувийн мэдээлэл":"Personal Information"}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {([["firstName",t.booking.firstName,"text"],["lastName",t.booking.lastName,"text"],["phone",t.booking.phone,"tel"],["email",t.booking.email,"email"]] as const).map(([name,label,type])=>(
                  <div key={name}>
                    <label className="font-body text-[10px] tracking-[0.2em] uppercase text-steel block mb-1.5">{label[lang]}</label>
                    <input name={name} type={type} value={form[name]} onChange={ch}
                      className="w-full bg-cream border border-primary/15 focus:border-primary outline-none px-4 py-3 font-body text-sm text-deep cursor-none" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="font-body text-[10px] tracking-widest uppercase text-steel block mb-1.5">{t.booking.checkIn[lang]}</label>
                  <input name="checkIn" type="date" value={form.checkIn} onChange={ch}
                    className="w-full bg-cream border border-primary/15 focus:border-primary outline-none px-4 py-3 font-body text-sm cursor-none" />
                </div>
                <div>
                  <label className="font-body text-[10px] tracking-widest uppercase text-steel block mb-1.5">{t.booking.checkOut[lang]}</label>
                  <input name="checkOut" type="date" value={form.checkOut} onChange={ch}
                    className="w-full bg-cream border border-primary/15 focus:border-primary outline-none px-4 py-3 font-body text-sm cursor-none" />
                </div>
                <div>
                  <label className="font-body text-[10px] tracking-widest uppercase text-steel block mb-1.5">{t.booking.guests[lang]}</label>
                  <select name="guests" value={form.guests} onChange={ch}
                    className="w-full bg-cream border border-primary/15 focus:border-primary outline-none px-4 py-3 font-body text-sm cursor-none appearance-none">
                    {["1","2","3","4","5"].map(n=><option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={()=>setStep(2)} className="font-body text-[11px] tracking-[0.25em] uppercase bg-primary hover:bg-primary-dark text-white px-10 py-4 cursor-none transition-colors">
                {lang==="mn"?"Үргэлжлүүлэх":"Continue"}
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step===2 && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-deep mb-6">{lang==="mn"?"Өрөө & Үйлчилгээ":"Room & Services"}</h2>
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-primary mb-3">{t.rooms.title[lang]}</p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {rooms.map(r=>(
                  <div key={r.id} onClick={()=>setForm(f=>({...f,room:r.id}))}
                    className={`relative overflow-hidden border-2 cursor-none transition-all ${form.room===r.id?"border-primary":"border-transparent"}`}>
                    <div className="relative h-28">
                      <Image src={r.img} alt={r.name[lang]} fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-deep/80 to-transparent" />
                      <div className="absolute bottom-2 left-3">
                        <div className="font-body text-xs font-semibold text-white">{r.name[lang]}</div>
                        <div className="font-body text-[10px] text-gold">{formatMNT(r.priceBuilding2??r.priceBuilding1??0)}</div>
                      </div>
                      {form.room===r.id && <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"><CheckCircle size={12} className="text-white"/></div>}
                    </div>
                  </div>
                ))}
              </div>

              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-primary mb-3">{t.services.eyebrow[lang]}</p>
              <div className="space-y-2 mb-6">
                {services.map(s=>(
                  <div key={s.id} onClick={()=>toggleSvc(s.id)}
                    className={`flex items-center justify-between p-4 border cursor-none transition-all ${form.selectedServices.includes(s.id)?"border-primary bg-primary/5":"border-primary/15 hover:border-primary/30"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 ${form.selectedServices.includes(s.id)?"border-primary bg-primary":"border-steel/40"}`}>
                        {form.selectedServices.includes(s.id)&&<Check size={12} className="text-white"/>}
                      </div>
                      <div>
                        <div className="font-body text-sm font-medium text-deep">{s.name[lang]}</div>
                        <div className="font-body text-xs text-steel">{s.duration}</div>
                      </div>
                    </div>
                    <span className="font-body text-sm text-primary font-medium shrink-0">{formatMNT(s.price)}</span>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <label className="font-body text-[10px] tracking-widest uppercase text-steel block mb-1.5">{t.booking.notes[lang]}</label>
                <textarea name="notes" value={form.notes} onChange={ch as React.ChangeEventHandler<HTMLTextAreaElement>} rows={3}
                  className="w-full bg-cream border border-primary/15 focus:border-primary outline-none px-4 py-3 font-body text-sm cursor-none resize-none" />
              </div>

              <div className="flex gap-4">
                <button onClick={()=>setStep(1)} className="font-body text-[11px] tracking-widest uppercase text-steel border border-steel/30 hover:border-steel px-8 py-4 cursor-none">
                  {lang==="mn"?"Буцах":"Back"}
                </button>
                <button onClick={()=>setStep(3)} className="font-body text-[11px] tracking-[0.25em] uppercase bg-primary hover:bg-primary-dark text-white px-10 py-4 cursor-none transition-colors">
                  {lang==="mn"?"Төлбөр рүү":"To Payment"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step===3 && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-deep mb-6">{lang==="mn"?"Төлбөрийн арга":"Payment Method"}</h2>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  {id:"qpay",icon:QrCode,    label:t.booking.qpay},
                  {id:"bank",icon:Banknote,  label:t.booking.bank},
                  {id:"cash",icon:Phone,     label:t.booking.cash},
                ].map(m=>(
                  <div key={m.id} onClick={()=>setPayMethod(m.id as typeof payMethod)}
                    className={`p-5 border-2 cursor-none text-center transition-all ${payMethod===m.id?"border-primary bg-primary/5":"border-primary/15 hover:border-primary/30"}`}>
                    <m.icon size={22} className={`mx-auto mb-2 ${payMethod===m.id?"text-primary":"text-steel"}`} />
                    <div className={`font-body text-xs font-medium ${payMethod===m.id?"text-primary":"text-steel"}`}>{m.label[lang]}</div>
                  </div>
                ))}
              </div>

              {payMethod==="qpay" && (
                <div className="border border-primary/15 p-7 text-center mb-6 bg-cream">
                  <p className="font-body text-[10px] tracking-[0.3em] uppercase text-primary mb-4">{t.booking.qpayNote[lang]}</p>
                  <div className="inline-block p-4 bg-white border border-primary/20 mb-4">
                    <svg width="140" height="140" viewBox="0 0 140 140">
                      <rect width="140" height="140" fill="white"/>
                      <rect x="8" y="8" width="38" height="38" fill="none" stroke="#1a6b8a" strokeWidth="4"/>
                      <rect x="14" y="14" width="26" height="26" fill="#1a6b8a"/>
                      <rect x="94" y="8" width="38" height="38" fill="none" stroke="#1a6b8a" strokeWidth="4"/>
                      <rect x="100" y="14" width="26" height="26" fill="#1a6b8a"/>
                      <rect x="8" y="94" width="38" height="38" fill="none" stroke="#1a6b8a" strokeWidth="4"/>
                      <rect x="14" y="100" width="26" height="26" fill="#1a6b8a"/>
                      {[55,62,69,76,83].map((x,i)=>(<rect key={i} x={x} y={8+i*6} width="4" height="4" fill="#1a6b8a"/>))}
                      {[55,62,76,83].map((y,i)=>(<rect key={i} x={55+i*7} y={y} width="4" height="4" fill="#1a6b8a"/>))}
                      <text x="70" y="134" textAnchor="middle" fontSize="7" fill="#1a6b8a" fontFamily="sans-serif">SEMJID KHUJIRT</text>
                    </svg>
                  </div>
                  <div className="font-display text-2xl font-semibold text-primary mb-1">{formatMNT(total)}</div>
                  <div className="font-body text-xs text-steel mt-4 bg-white border border-primary/10 p-4 text-left space-y-1">
                    <p><span className="text-steel/60">{lang==="mn"?"Байгууллага:":"Company:"}</span> ТОБАСЭ ХХК</p>
                    <p><span className="text-steel/60">{lang==="mn"?"Данс:":"Account:"}</span> 4900 0123 4567</p>
                    <p><span className="text-steel/60">{lang==="mn"?"Банк:":"Bank:"}</span> {lang==="mn"?"Хаан Банк":"Khan Bank"}</p>
                  </div>
                </div>
              )}

              {payMethod==="bank" && (
                <div className="border border-primary/15 p-6 bg-cream mb-6">
                  <h3 className="font-body font-medium text-sm text-deep mb-4">{lang==="mn"?"Банкны мэдээлэл":"Bank Details"}</h3>
                  {[
                    [lang==="mn"?"Байгууллага":"Company","ТОБАСЭ ХХК"],
                    [lang==="mn"?"Данс":"Account","4900 0123 4567"],
                    [lang==="mn"?"Банк":"Bank",lang==="mn"?"Хаан Банк":"Khan Bank"],
                    [lang==="mn"?"Гүйлгээний утга":"Reference",lang==="mn"?"Нэр + утас":"Your name + phone"],
                    [lang==="mn"?"Дүн":"Amount",formatMNT(total)],
                  ].map(([k,v])=>(
                    <div key={k} className="flex justify-between py-2 border-b border-primary/10 last:border-0">
                      <span className="font-body text-xs text-steel">{k}</span>
                      <span className="font-body text-xs font-medium text-deep">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {payMethod==="cash" && (
                <div className="border border-primary/15 p-6 bg-cream text-center mb-6">
                  <p className="font-body text-sm text-steel mb-3">
                    {lang==="mn"?"Ирэх өдрөө байранд бэлэн мөнгөөр төлнө үү.":"Pay in cash upon arrival at the resort."}
                  </p>
                  <div className="flex justify-center gap-4 mt-3">
                    <a href={`tel:+976${PHONE1.replace(/-/g,"")}`} className="font-body text-sm text-primary no-underline cursor-none flex items-center gap-1.5"><Phone size={12}/>{PHONE1}</a>
                    <a href={`tel:+976${PHONE2.replace(/-/g,"")}`} className="font-body text-sm text-primary no-underline cursor-none flex items-center gap-1.5"><Phone size={12}/>{PHONE2}</a>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={()=>setStep(2)} className="font-body text-[11px] tracking-widest uppercase text-steel border border-steel/30 hover:border-steel px-8 py-4 cursor-none">
                  {lang==="mn"?"Буцах":"Back"}
                </button>
                <button onClick={()=>setSubmitted(true)}
                  className="flex-1 font-body text-[11px] tracking-[0.25em] uppercase bg-primary hover:bg-primary-dark text-white py-4 cursor-none transition-colors">
                  {t.booking.submit[lang]}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-primary text-white p-6">
            <h3 className="font-display text-lg font-semibold mb-4">{lang==="mn"?"Захиалгын дүн":"Summary"}</h3>
            {selectedRoom ? (
              <div className="space-y-3 mb-4">
                <div className="relative h-28 overflow-hidden">
                  <Image src={selectedRoom.img} alt={selectedRoom.name[lang]} fill className="object-cover"/>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">{selectedRoom.name[lang]}</span>
                  <span>{formatMNT(roomPrice)} × {nights} × {form.guests}</span>
                </div>
              </div>
            ) : (
              <p className="font-body text-xs text-white/40 mb-4">{lang==="mn"?"Өрөө сонгоогүй":"No room selected"}</p>
            )}
            {form.selectedServices.length>0&&(
              <div className="border-t border-white/10 pt-3 space-y-2 mb-3">
                {form.selectedServices.map(id=>{
                  const s=services.find(sv=>sv.id===id);
                  return s?(<div key={id} className="flex justify-between text-xs"><span className="text-white/60">{s.name[lang]}</span><span>{formatMNT(s.price)}</span></div>):null;
                })}
              </div>
            )}
            <div className="border-t border-white/20 pt-4 flex justify-between items-center">
              <span className="font-body text-sm text-white/70">{t.booking.total[lang]}</span>
              <span className="font-display text-xl font-semibold text-gold">{formatMNT(total)}</span>
            </div>
          </div>
          <div className="border border-primary/15 p-5 bg-cream">
            <h4 className="font-body text-xs font-medium text-deep mb-3">{lang==="mn"?"Утсаар захиалах":"Call to Book"}</h4>
            <div className="space-y-2">
              <a href={`tel:+976${PHONE1.replace(/-/g,"")}`} className="font-body text-sm text-primary font-medium no-underline cursor-none flex items-center gap-2"><Phone size={12}/>{PHONE1}</a>
              <a href={`tel:+976${PHONE2.replace(/-/g,"")}`} className="font-body text-sm text-primary font-medium no-underline cursor-none flex items-center gap-2"><Phone size={12}/>{PHONE2}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Check({size, className}:{size:number,className?:string}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}><polyline points="20 6 9 17 4 12"/></svg>;
}
