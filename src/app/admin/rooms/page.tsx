"use client";
import { useState, useEffect, useCallback } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { rooms } from "@/lib/data";
import { BedDouble, ChevronLeft, ChevronRight, CheckCircle, Lock, Plus, X, Loader2 } from "lucide-react";

type Booking = {
  id: string; ref: string; fname: string; lname: string;
  check_in: string; check_out: string; room_id: string; status: string;
};

type Block = {
  id: string; room_id: string; from_date: string; to_date: string; reason: string;
};

const MONTHS = ["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар","7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"];

export default function RoomsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [date, setDate] = useState(new Date());
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blockForm, setBlockForm] = useState({ room_id: "", from_date: "", to_date: "", reason: "Засвар үйлчилгээ" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [{ data: bk }, { data: bl }] = await Promise.all([
      supabaseAdmin.from("bookings").select("*").not("status", "eq", "cancelled"),
      supabaseAdmin.from("room_blocks").select("*"),
    ]);
    setBookings(bk || []);
    setBlocks(bl || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const getBookingForDay = (roomId: string, day: number) => {
    const d = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return bookings.find(b => b.room_id === roomId && b.check_in <= d && b.check_out > d);
  };

  const getBlockForDay = (roomId: string, day: number) => {
    const d = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return blocks.find(b => b.room_id === roomId && b.from_date <= d && b.to_date >= d);
  };

  const occupiedToday = rooms.filter(r =>
    bookings.some(b => b.room_id === r.id && b.check_in <= todayStr && b.check_out > todayStr) ||
    blocks.some(b => b.room_id === r.id && b.from_date <= todayStr && b.to_date >= todayStr)
  ).length;

  const saveBlock = async () => {
    if (!blockForm.room_id || !blockForm.from_date || !blockForm.to_date) {
      setError("Бүх талбарыг бөглөнө үү."); return;
    }
    if (blockForm.from_date > blockForm.to_date) {
      setError("Эхлэх огноо дуусах огнооноос өмнө байх ёстой."); return;
    }
    setSaving(true); setError("");
    const { error: err } = await supabaseAdmin.from("room_blocks").insert({
      room_id: blockForm.room_id,
      from_date: blockForm.from_date,
      to_date: blockForm.to_date,
      reason: blockForm.reason || "Хаалттай",
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowBlockModal(false);
    setBlockForm({ room_id: "", from_date: "", to_date: "", reason: "Засвар үйлчилгээ" });
    load();
  };

  const removeBlock = async (id: string) => {
    await supabaseAdmin.from("room_blocks").delete().eq("id", id);
    load();
  };

  const inp = "w-full bg-slate-50 border border-slate-200 focus:border-teal outline-none px-4 py-2.5 text-[13px] text-slate-700 rounded-lg transition-colors";
  const lbl = "text-[11px] tracking-wider uppercase text-slate-400 block mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Өрөөний хүртээмж</h1>
          <p className="text-[13px] text-slate-400 mt-1">Захиалга болон гараар хаасан өдрүүд</p>
        </div>
        <button
          onClick={() => setShowBlockModal(true)}
          className="flex items-center gap-2 bg-teal hover:bg-teal-dark text-white px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer"
        >
          <Lock size={15}/> Өрөө хаах
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Нийт өрөө төрөл", value: rooms.length, color: "text-slate-700", bg: "bg-slate-100" },
          { label: "Өнөөдөр эзэлсэн", value: occupiedToday, color: "text-red-600", bg: "bg-red-50" },
          { label: "Өнөөдөр чөлөөтэй", value: rooms.length - occupiedToday, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5`}>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-[12px] text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Active blocks list */}
      {blocks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Lock size={15} className="text-red-400"/> Гараар хаасан өрөөнүүд</h2>
          <div className="space-y-2">
            {blocks.map(b => {
              const room = rooms.find(r => r.id === b.room_id);
              return (
                <div key={b.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock size={14} className="text-red-400 shrink-0"/>
                    <div>
                      <span className="text-[13px] font-medium text-slate-700">{room?.name.mn || b.room_id}</span>
                      <span className="text-[12px] text-slate-400 ml-2">{b.from_date} → {b.to_date}</span>
                      {b.reason && <span className="text-[11px] text-red-400 ml-2">· {b.reason}</span>}
                    </div>
                  </div>
                  <button onClick={() => removeBlock(b.id)} className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1">
                    <X size={16}/>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button onClick={() => setDate(new Date(year, month-1))} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <ChevronLeft size={18} className="text-slate-500"/>
          </button>
          <h2 className="font-semibold text-slate-800">{MONTHS[month]} {year}</h2>
          <button onClick={() => setDate(new Date(year, month+1))} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <ChevronRight size={18} className="text-slate-500"/>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider min-w-[160px]">Өрөө</th>
                {days.map(d => {
                  const isToday = d===today.getDate() && month===today.getMonth() && year===today.getFullYear();
                  return (
                    <th key={d} className={`px-2 py-3 text-center text-[11px] font-medium min-w-[32px] ${isToday?"text-teal":"text-slate-400"}`}>{d}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rooms.map(room => (
                <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="sticky left-0 bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BedDouble size={15} className="text-slate-400"/>
                      <div className="text-[12px] font-medium text-slate-700">{room.name.mn}</div>
                    </div>
                  </td>
                  {days.map(d => {
                    const booking = getBookingForDay(room.id, d);
                    const block = getBlockForDay(room.id, d);
                    const isToday = d===today.getDate() && month===today.getMonth() && year===today.getFullYear();
                    return (
                      <td key={d} className={`px-1 py-2 text-center ${isToday?"bg-teal/5":""}`}>
                        {block ? (
                          <div title={block.reason} className="w-6 h-6 rounded-full mx-auto bg-red-400 flex items-center justify-center cursor-help">
                            <Lock size={9} className="text-white"/>
                          </div>
                        ) : booking ? (
                          <div title={`${booking.fname} ${booking.lname} (${booking.ref})`}
                            className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center cursor-help ${booking.status==="confirmed"?"bg-emerald-500":"bg-amber-400"}`}>
                            <span className="text-white text-[8px] font-bold">{booking.fname[0]}</span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full mx-auto bg-slate-100 flex items-center justify-center">
                            <CheckCircle size={10} className="text-slate-300"/>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-500"/><span className="text-[12px] text-slate-500">Баталгаажсан</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-amber-400"/><span className="text-[12px] text-slate-500">Хүлээгдэж буй</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-400"/><span className="text-[12px] text-slate-500">Хаалттай</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-slate-100"/><span className="text-[12px] text-slate-500">Чөлөөтэй</span></div>
        </div>
      </div>

      {/* Block modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl text-slate-800 flex items-center gap-2"><Lock size={18} className="text-red-400"/> Өрөө хаах</h2>
              <button onClick={() => { setShowBlockModal(false); setError(""); }} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={lbl}>Өрөө сонгох</label>
                <select value={blockForm.room_id} onChange={e => setBlockForm(f => ({...f, room_id: e.target.value}))} className={inp}>
                  <option value="">-- Өрөө сонгох --</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name.mn}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Эхлэх огноо</label>
                  <input type="date" value={blockForm.from_date} onChange={e => setBlockForm(f => ({...f, from_date: e.target.value}))} className={inp}/>
                </div>
                <div>
                  <label className={lbl}>Дуусах огноо</label>
                  <input type="date" value={blockForm.to_date} onChange={e => setBlockForm(f => ({...f, to_date: e.target.value}))} className={inp}/>
                </div>
              </div>
              <div>
                <label className={lbl}>Шалтгаан</label>
                <select value={blockForm.reason} onChange={e => setBlockForm(f => ({...f, reason: e.target.value}))} className={inp}>
                  <option>Засвар үйлчилгээ</option>
                  <option>Захиалга дүүрсэн</option>
                  <option>Түр хаалттай</option>
                  <option>Бусад</option>
                </select>
              </div>
            </div>
            {error && <p className="text-red-500 text-[12px] mt-3">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowBlockModal(false); setError(""); }} className="flex-1 border border-slate-200 text-slate-500 py-2.5 rounded-lg text-[13px] cursor-pointer">Болих</button>
              <button onClick={saveBlock} disabled={saving} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin"/> Хадгалж байна...</> : <><Lock size={14}/> Хаах</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
