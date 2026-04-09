"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Booking = {
  id: string; ref: string; fname: string; lname: string;
  check_in: string; check_out: string; room_id: string; status: string;
};

const DAYS = ["Да","Мя","Лх","Пү","Ба","Бя","Ня"];
const MONTHS = ["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар","7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"];

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState<Booking[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("bookings").select("*").order("check_in");
    setBookings(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const getBookingsForDay = (day: number) => {
    const d = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return bookings.filter(b => b.check_in <= d && b.check_out > d);
  };

  const statusColor = (s: string) =>
    s === "confirmed" ? "bg-emerald-500" : s === "cancelled" ? "bg-red-400" : "bg-amber-400";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Захиалгын календар</h1>
        <p className="text-[13px] text-slate-400 mt-1">Өрөөний захиалгын хуваарь</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <button onClick={() => setDate(new Date(year, month-1))} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <ChevronLeft size={18} className="text-slate-500"/>
          </button>
          <h2 className="font-semibold text-slate-800 text-lg">{MONTHS[month]} {year}</h2>
          <button onClick={() => setDate(new Date(year, month+1))} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <ChevronRight size={18} className="text-slate-500"/>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 bg-slate-50">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-[11px] font-medium text-slate-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {Array(startOffset).fill(null).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 bg-slate-50/50"/>
          ))}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const dayBookings = getBookingsForDay(day);
            const today = new Date();
            const isToday = today.getDate()===day && today.getMonth()===month && today.getFullYear()===year;
            return (
              <div key={day} onClick={() => setSelected(dayBookings)}
                className={`h-24 p-2 cursor-pointer hover:bg-slate-50 transition-colors ${dayBookings.length > 0 ? "bg-white" : ""}`}>
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium mb-1 ${isToday ? "bg-teal text-white" : "text-slate-700"}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayBookings.slice(0,3).map(b => (
                    <div key={b.id} className={`${statusColor(b.status)} text-white text-[10px] px-1.5 py-0.5 rounded truncate`}>
                      {b.fname} {b.lname[0]}.
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-[10px] text-slate-400">+{dayBookings.length-3} дахин</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6">
        {[["bg-emerald-500","Баталгаажсан"],["bg-amber-400","Хүлээгдэж буй"],["bg-red-400","Цуцлагдсан"]].map(([color,label]) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`}/>
            <span className="text-[12px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected day bookings */}
      {selected.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Сонгосон өдрийн захиалгууд ({selected.length})</h3>
          <div className="space-y-3">
            {selected.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="text-[13px] font-medium text-slate-800">{b.fname} {b.lname}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{b.ref} · {b.room_id} · {b.check_in} → {b.check_out}</div>
                </div>
                <span className={`text-[11px] px-3 py-1 rounded-full font-medium text-white ${statusColor(b.status)}`}>
                  {b.status === "confirmed" ? "Баталгаажсан" : b.status === "cancelled" ? "Цуцлагдсан" : "Хүлээгдэж буй"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
