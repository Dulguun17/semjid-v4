"use client";
import { useState, useEffect, useCallback } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { rooms } from "@/lib/data";
import { BedDouble, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

type Booking = {
  id: string; ref: string; fname: string; lname: string;
  check_in: string; check_out: string; room_id: string; status: string;
};

const MONTHS = ["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар","7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"];

export default function RoomsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [date, setDate] = useState(new Date());

  const load = useCallback(async () => {
    const { data } = await supabaseAdmin.from("bookings").select("*")
      .not("status", "eq", "cancelled");
    setBookings(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isBooked = (roomId: string, day: number) => {
    const d = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return bookings.find(b => b.room_id === roomId && b.check_in <= d && b.check_out > d);
  };

  const getBookingForDay = (roomId: string, day: number) => {
    const d = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return bookings.find(b => b.room_id === roomId && b.check_in <= d && b.check_out > d);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = new Date();

  // Stats
  const totalRooms = rooms.length;
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const occupiedToday = rooms.filter(r => bookings.some(b => b.room_id === r.id && b.check_in <= todayStr && b.check_out > todayStr)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Өрөөний хүртээмж</h1>
        <p className="text-[13px] text-slate-400 mt-1">Өрөөний захиалгын байдал</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Нийт өрөө", value: totalRooms, color: "text-slate-700", bg: "bg-slate-100" },
          { label: "Өнөөдөр эзэлсэн", value: occupiedToday, color: "text-red-600", bg: "bg-red-50" },
          { label: "Өнөөдөр чөлөөтэй", value: totalRooms - occupiedToday, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5`}>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-[12px] text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Month navigation */}
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

        {/* Grid */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider min-w-[140px]">Өрөө</th>
                {days.map(d => {
                  const isToday = d===today.getDate() && month===today.getMonth() && year===today.getFullYear();
                  return (
                    <th key={d} className={`px-2 py-3 text-center text-[11px] font-medium min-w-[32px] ${isToday?"text-teal":"text-slate-400"}`}>
                      {d}
                    </th>
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
                      <div>
                        <div className="text-[12px] font-medium text-slate-700">{room.name.mn}</div>
                      </div>
                    </div>
                  </td>
                  {days.map(d => {
                    const booking = getBookingForDay(room.id, d);
                    const isToday = d===today.getDate() && month===today.getMonth() && year===today.getFullYear();
                    return (
                      <td key={d} className={`px-1 py-2 text-center ${isToday?"bg-teal/5":""}`}>
                        {booking ? (
                          <div
                            title={`${booking.fname} ${booking.lname} (${booking.ref})`}
                            className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center cursor-help ${booking.status==="confirmed"?"bg-emerald-500":"bg-amber-400"}`}
                          >
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

        {/* Legend */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-6">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-500"/><span className="text-[12px] text-slate-500">Баталгаажсан</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-amber-400"/><span className="text-[12px] text-slate-500">Хүлээгдэж буй</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-slate-100"/><span className="text-[12px] text-slate-500">Чөлөөтэй</span></div>
          <div className="text-[12px] text-slate-400 ml-auto">Хулганаар дарж дэлгэрэнгүй харна уу</div>
        </div>
      </div>
    </div>
  );
}
