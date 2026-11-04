"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { rooms as roomTypes } from "@/lib/data";
import { workspaceAuthorizationHeaders } from "@/lib/workspace-api";
import { ulaanbaatarToday } from "@/lib/bed-availability";
import { BedDouble, ChevronLeft, ChevronRight, Loader2, Lock, X } from "lucide-react";

type Booking = {
  id: string; ref: string; fname: string; lname: string;
  check_in: string; check_out: string; room_id: string; status: string;
  guests: number;
  bed_allocation_required: boolean;
  actual_check_in_at: string | null;
  actual_check_out_at: string | null;
  bed_assignments: { bed_id: string; guest_gender: string; released_at: string | null }[];
};

type Block = {
  id: string; room_id: string; from_date: string; to_date: string; reason: string | null;
};

type RoomUnit = {
  id: string;
  category_id: string;
  capacity: number;
  beds: { id: string; bed_number: number }[];
};

const MONTHS = ["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар","7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"];

function centerDate() {
  return new Date(`${ulaanbaatarToday()}T12:00:00`);
}

export default function RoomsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [roomUnits, setRoomUnits] = useState<RoomUnit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [date, setDate] = useState(centerDate);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blockForm, setBlockForm] = useState({ room_id: "", from_date: "", to_date: "", reason: "Засвар үйлчилгээ" });
  const [error, setError] = useState("");

  const fetchAvailability = useCallback(async () => {
    const headers = await workspaceAuthorizationHeaders();
    const [bookingsResponse, roomsResponse] = await Promise.all([
      fetch("/api/staff/bookings", { headers }),
      fetch("/api/staff/rooms", { headers }),
    ]);
    const [bookingData, roomData] = await Promise.all([bookingsResponse.json(), roomsResponse.json()]);
    if (!bookingsResponse.ok) throw new Error(bookingData.error || "Захиалгын мэдээлэл ачаалж чадсангүй.");
    if (!roomsResponse.ok) throw new Error(roomData.error || "Өрөөний мэдээлэл ачаалж чадсангүй.");
    return {
      bookings: (bookingData.bookings || []) as Booking[],
      blocks: (roomData.blocks || []) as Block[],
      rooms: (roomData.rooms || []).map((room: { id: string; category_id: string; category?: { capacity?: number } | null; beds?: RoomUnit["beds"] }) => ({
        id: room.id,
        category_id: room.category_id,
        capacity: room.category?.capacity || 0,
        beds: room.beds || [],
      })) as RoomUnit[],
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const availability = await fetchAvailability();
      setBookings(availability.bookings);
      setBlocks(availability.blocks);
      setRoomUnits(availability.rooms);
      setLoaded(true);
    } catch (loadError) {
      console.error("Failed to load room availability", loadError);
      setError(loadError instanceof Error ? loadError.message : "Өрөөний хүртээмжийг шалгаж чадсангүй.");
    }
  }, [fetchAvailability]);

  useEffect(() => {
    let active = true;
    fetchAvailability()
      .then(availability => {
        if (!active) return;
        setBookings(availability.bookings);
        setBlocks(availability.blocks);
        setRoomUnits(availability.rooms);
        setLoaded(true);
      })
      .catch(loadError => {
        console.error("Failed to load room availability", loadError);
        if (active) setError(loadError instanceof Error ? loadError.message : "Өрөөний хүртээмжийг шалгаж чадсангүй.");
      });
    return () => { active = false; };
  }, [fetchAvailability]);

  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = centerDate();
  const todayStr = ulaanbaatarToday();

  const dateForDay = (day: number) => `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const isActiveOnDate = (booking: Booking, selectedDate: string) =>
    ["pending", "confirmed", "checked_in"].includes(booking.status) &&
    ((booking.check_in <= selectedDate && booking.check_out > selectedDate) ||
      (booking.status === "checked_in" &&
        booking.actual_check_out_at === null && selectedDate >= todayStr));
  const hasLegacyHoldForDate = (room: RoomUnit, selectedDate: string) => {
    return bookings.some(booking =>
      booking.bed_allocation_required &&
      (booking.room_id === room.id || booking.room_id === room.category_id) &&
      isActiveOnDate(booking, selectedDate)
    );
  };
  const getLegacyHoldForDay = (room: RoomUnit, day: number) => hasLegacyHoldForDate(room, dateForDay(day));
  const getBedAssignmentForDate = (roomId: string, bedId: string, selectedDate: string) => {
    return bookings.find(booking =>
      booking.room_id === roomId && isActiveOnDate(booking, selectedDate) &&
      booking.bed_assignments?.some(assignment =>
        assignment.bed_id === bedId && !assignment.released_at
      )
    );
  };
  const getBedAssignmentForDay = (roomId: string, bedId: string, day: number) =>
    getBedAssignmentForDate(roomId, bedId, dateForDay(day));

  const getBlockForDate = (roomId: string, d: string) =>
    blocks.find(b => b.room_id === roomId && b.from_date <= d && b.to_date >= d);
  const getBlockForDay = (roomId: string, day: number) => getBlockForDate(roomId, dateForDay(day));

  const reservedBedsToday = roomUnits.reduce((total, room) =>
    total + room.beds.filter(bed => getBedAssignmentForDate(room.id, bed.id, todayStr)).length, 0);
  const availableBedsToday = roomUnits.reduce((total, room) => {
    if (hasLegacyHoldForDate(room, todayStr) || getBlockForDate(room.id, todayStr)) return total;
    return total + room.beds.filter(bed => !getBedAssignmentForDate(room.id, bed.id, todayStr)).length;
  }, 0);
  const legacyAllocationsToday = bookings.filter(booking =>
    booking.bed_allocation_required && isActiveOnDate(booking, todayStr)
  ).length;

  const saveBlock = async () => {
    if (!blockForm.room_id || !blockForm.from_date || !blockForm.to_date) {
      setError("Бүх талбарыг бөглөнө үү."); return;
    }
    if (blockForm.from_date > blockForm.to_date) {
      setError("Эхлэх огноо дуусах огнооноос өмнө байх ёстой."); return;
    }
    setSaving(true); setError("");
    const { error: err } = await supabase.from("room_blocks").insert({
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
    const { error: updateError } = await supabase.from("room_blocks")
      .update({ cancelled_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) {
      console.error("Failed to cancel room closure", updateError);
      setError(updateError.message);
      return;
    }
    await load();
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
          disabled={!loaded}
          className="flex items-center gap-2 bg-teal hover:bg-teal-dark text-white px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer"
        >
          <Lock size={15}/> Өрөө хаах
        </button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!loaded && !error && <p role="status" className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Өрөөний хүртээмжийг ачаалж байна…</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Бүртгэлтэй ор", value: roomUnits.reduce((total, room) => total + room.beds.length, 0), color: "text-slate-700", bg: "bg-slate-100" },
          { label: "Өнөөдрийн захиалгатай ор", value: reservedBedsToday, color: "text-red-600", bg: "bg-red-50" },
          { label: "Өнөөдрийн боломжтой ор", value: availableBedsToday, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Ор хуваарилах хуучин захиалга", value: legacyAllocationsToday, color: "text-amber-700", bg: "bg-amber-50" },
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
              const room = roomUnits.find(r => r.id === b.room_id);
              const category = roomTypes.find(r => r.id === room?.category_id);
              return (
                <div key={b.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock size={14} className="text-red-400 shrink-0"/>
                    <div>
                      <span className="text-[13px] font-medium text-slate-700">{category ? `${category.name.mn} ${room?.id}` : b.room_id}</span>
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
              {roomUnits.map(room => (
                <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="sticky left-0 bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BedDouble size={15} className="text-slate-400"/>
                      <div>
                        <div className="text-[12px] font-medium text-slate-700">{room.id}</div>
                        <div className="text-[11px] text-slate-400">{roomTypes.find(type => type.id === room.category_id)?.name.mn || room.category_id} · {room.capacity} ор</div>
                      </div>
                    </div>
                  </td>
                  {days.map(d => {
                    const block = getBlockForDay(room.id, d);
                    const isToday = d===today.getDate() && month===today.getMonth() && year===today.getFullYear();
                    const legacyHold = getLegacyHoldForDay(room, d);
                    return (
                      <td key={d} className={`px-1 py-2 text-center ${isToday?"bg-teal/5":""}`}>
                        <div className="mx-auto flex max-w-16 flex-wrap justify-center gap-0.5">
                          {room.beds.map(bed => {
                            const booking = getBedAssignmentForDay(room.id, bed.id, d);
                            const state = block ? "closed" : legacyHold ? "allocation" : booking?.status || "available";
                            const color = state === "closed" ? "bg-red-500"
                              : state === "allocation" ? "bg-amber-500"
                              : state === "checked_in" ? "bg-blue-600"
                              : state === "confirmed" ? "bg-emerald-500"
                              : state === "pending" ? "bg-amber-400" : "bg-slate-200";
                            const assignment = booking?.bed_assignments?.find(row =>
                              row.bed_id === bed.id && !row.released_at
                            );
                            const title = `${bed.id} · ${state === "allocation" ? "bed allocation required" : booking ? `${booking.fname} ${booking.lname} · ${booking.ref} · ${assignment?.guest_gender || "gender unknown"}` : block?.reason || "available"}`;
                            return <span key={bed.id} title={title} className={`h-3 w-3 rounded-sm ${color}`} />;
                          })}
                          {room.beds.length === 0 && <span className="text-[9px] text-amber-700">No beds</span>}
                        </div>
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
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500"/><span className="text-[12px] text-slate-500">Дүүрэн захиалагдсан</span></div>
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
                  {roomUnits.map(r => <option key={r.id} value={r.id}>{`${roomTypes.find(type => type.id === r.category_id)?.name.mn || r.category_id} ${r.id}`}</option>)}
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
