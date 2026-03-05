"use client";
import { useState, useEffect, useCallback } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { formatMNT } from "@/lib/data";
import { Calendar, TrendingUp, Clock, CheckCircle, XCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

type Booking = {
  id: string; ref: string; fname: string; lname: string; phone: string;
  check_in: string; check_out: string; room_id: string;
  total: number; status: string; created_at: string;
};

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabaseAdmin.from("bookings").select("*").order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabaseAdmin.from("bookings").update({ status }).eq("id", id);
    load();
  };

  const confirmed = bookings.filter(b => b.status === "confirmed");
  const pending   = bookings.filter(b => b.status === "pending");
  const cancelled = bookings.filter(b => b.status === "cancelled");
  const revenue   = confirmed.reduce((s, b) => s + (b.total || 0), 0);

  const monthlyRevenue = Array(12).fill(0);
  confirmed.forEach(b => { const m = new Date(b.created_at).getMonth(); monthlyRevenue[m] += b.total || 0; });
  const maxRev = Math.max(...monthlyRevenue, 1);

  const roomCount: Record<string, number> = {};
  bookings.forEach(b => { if(b.room_id) roomCount[b.room_id] = (roomCount[b.room_id]||0)+1; });
  const topRooms = Object.entries(roomCount).sort((a,b)=>b[1]-a[1]).slice(0,4);

  const statusBadge = (s: string) => s === "confirmed" ? "bg-emerald-100 text-emerald-700" : s === "cancelled" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700";
  const statusLabel = (s: string) => s === "confirmed" ? "Баталгаажсан" : s === "cancelled" ? "Цуцлагдсан" : "Хүлээгдэж буй";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Хяналтын самбар</h1>
        <p className="text-[13px] text-slate-400 mt-1">{new Date().toLocaleDateString("mn-MN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Нийт захиалга", value:bookings.length, icon:Calendar, light:"bg-blue-50", text:"text-blue-600" },
          { label:"Хүлээгдэж буй", value:pending.length, icon:Clock, light:"bg-amber-50", text:"text-amber-600" },
          { label:"Баталгаажсан", value:confirmed.length, icon:CheckCircle, light:"bg-emerald-50", text:"text-emerald-600" },
          { label:"Нийт орлого", value:formatMNT(revenue), icon:TrendingUp, light:"bg-teal/10", text:"text-teal" },
        ].map(({ label, value, icon:Icon, light, text }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 ${light} rounded-xl flex items-center justify-center mb-4`}><Icon size={19} className={text}/></div>
            <div className={`text-2xl font-bold ${text} mb-1`}>{value}</div>
            <div className="text-[12px] text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="font-semibold text-slate-800">Сарын орлого</h2><p className="text-[12px] text-slate-400 mt-0.5">Баталгаажсан захиалгаар</p></div>
            <div className="text-right"><div className="text-xl font-bold text-teal">{formatMNT(revenue)}</div><div className="text-[11px] text-slate-400">Нийт орлого</div></div>
          </div>
          <div className="flex items-end gap-1.5 h-40">
            {monthlyRevenue.map((rev, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative group" style={{ height:"140px", display:"flex", alignItems:"flex-end" }}>
                  <div className="w-full bg-teal/10 hover:bg-teal transition-colors rounded-t-lg cursor-default"
                    style={{ height:`${Math.max((rev/maxRev)*140, rev>0?6:2)}px` }}
                    title={formatMNT(rev)}/>
                </div>
                <span className="text-[8px] text-slate-400">{i+1}р</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-1">Өрөөний эрэлт</h2>
          <p className="text-[12px] text-slate-400 mb-5">Нийт захиалгаар</p>
          {topRooms.length === 0 ? <p className="text-[13px] text-slate-300 text-center py-8">Өгөгдөл байхгүй</p> :
            topRooms.map(([room, count]) => {
              const pct = Math.round((count / Math.max(bookings.length,1)) * 100);
              return (
                <div key={room} className="mb-4">
                  <div className="flex justify-between mb-1.5"><span className="text-[12px] font-medium text-slate-600 capitalize">{room}</span><span className="text-[12px] text-teal font-semibold">{count}</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-teal rounded-full" style={{ width:`${pct}%` }}/></div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label:"Баталгаажсан", count:confirmed.length, icon:CheckCircle, color:"text-emerald-500", bg:"bg-emerald-50" },
          { label:"Хүлээгдэж буй", count:pending.length, icon:Clock, color:"text-amber-500", bg:"bg-amber-50" },
          { label:"Цуцлагдсан", count:cancelled.length, icon:XCircle, color:"text-red-500", bg:"bg-red-50" },
        ].map(({ label, count, icon:Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 flex items-center gap-4`}>
            <Icon size={28} className={color}/>
            <div><div className="text-2xl font-bold text-slate-800">{count}</div><div className="text-[12px] text-slate-500">{label}</div></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Сүүлийн захиалгууд</h2>
          <Link href="/admin/guests" className="text-[12px] text-teal flex items-center gap-1 no-underline hover:underline">Бүгдийг харах <ArrowUpRight size={13}/></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 text-left">
              {["Дугаар","Зочин","Утас","Өрөө","Ирэх","Явах","Дүн","Статус","Үйлдэл"].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.slice(0,10).map(b => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-[12px] font-mono text-teal whitespace-nowrap">{b.ref}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-700 whitespace-nowrap">{b.fname} {b.lname}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{b.phone}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500 capitalize">{b.room_id}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">{b.check_in}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">{b.check_out}</td>
                  <td className="px-4 py-3 text-[12px] font-semibold text-slate-700 whitespace-nowrap">{formatMNT(b.total||0)}</td>
                  <td className="px-4 py-3"><span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${statusBadge(b.status)}`}>{statusLabel(b.status)}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-1.5">
                    {b.status!=="confirmed"&&<button onClick={()=>updateStatus(b.id,"confirmed")} className="text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap">✓ Батлах</button>}
                    {b.status!=="cancelled"&&<button onClick={()=>updateStatus(b.id,"cancelled")} className="text-[11px] bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap">✕ Цуцлах</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length===0&&<div className="text-center py-16 text-slate-400"><Calendar size={32} className="mx-auto mb-3 opacity-30"/><p className="text-[13px]">Захиалга байхгүй байна</p></div>}
        </div>
      </div>
    </div>
  );
}
