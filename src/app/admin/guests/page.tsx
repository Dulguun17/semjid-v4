"use client";
import { useState, useEffect, useCallback } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { formatMNT } from "@/lib/data";
import { Search, Download, Check, X, ChevronDown, ChevronUp, Filter } from "lucide-react";

type Booking = {
  id: string; ref: string; fname: string; lname: string; phone: string;
  email: string; check_in: string; check_out: string; room_id: string;
  treatments: string[]; guests: number; notes: string; payment: string;
  total: number; status: string; created_at: string;
};

export default function GuestsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"pending"|"confirmed"|"cancelled">("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);

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

  const exportCSV = () => {
    const rows = [
      ["Дугаар","Нэр","Овог","Утас","И-мэйл","Өрөө","Ирэх","Явах","Хүн","Нийт дүн","Төлбөр","Статус","Огноо"],
      ...filtered.map(b => [b.ref,b.fname,b.lname,b.phone,b.email||"",b.room_id,b.check_in,b.check_out,b.guests,b.total,b.payment,b.status,b.created_at]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff"+csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "bookings.csv"; a.click();
  };

  const filtered = bookings
    .filter(b => filter === "all" || b.status === filter)
    .filter(b => {
      const q = search.toLowerCase();
      return !q || b.fname.toLowerCase().includes(q) || b.lname.toLowerCase().includes(q) ||
        b.phone.includes(q) || b.ref.toLowerCase().includes(q) || (b.email||"").toLowerCase().includes(q);
    });

  const statusBadge = (s: string) => s === "confirmed" ? "bg-emerald-100 text-emerald-700" : s === "cancelled" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700";
  const statusLabel = (s: string) => s === "confirmed" ? "Баталгаажсан" : s === "cancelled" ? "Цуцлагдсан" : "Хүлээгдэж буй";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Зочид</h1>
          <p className="text-[13px] text-slate-400 mt-1">Нийт {bookings.length} захиалга</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-teal hover:bg-teal-dark text-white px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer">
          <Download size={15}/> Excel татах
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Нэр, утас, захиалгын дугаараар хайх..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] outline-none focus:border-teal"/>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400"/>
          {(["all","pending","confirmed","cancelled"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-[12px] font-medium transition-colors cursor-pointer ${filter===f?"bg-teal text-white":"bg-white text-slate-400 border border-slate-200 hover:text-slate-600"}`}>
              {f==="all"?"Бүгд":f==="pending"?"Хүлээгдэж буй":f==="confirmed"?"Баталгаажсан":"Цуцлагдсан"}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-[12px] text-slate-400">{filtered.length} үр дүн</div>

      {/* Bookings list */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100">
          <p className="text-slate-400 text-[14px]">Захиалга олдсонгүй</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(expanded===b.id?null:b.id)}>
                {/* Avatar */}
                <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-teal font-semibold text-[14px]">{b.fname[0]}{b.lname[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-[14px]">{b.fname} {b.lname}</span>
                    <span className="text-[11px] font-mono text-teal bg-teal/10 px-2 py-0.5 rounded">{b.ref}</span>
                  </div>
                  <div className="text-[12px] text-slate-400 mt-0.5">{b.phone} · {b.check_in} → {b.check_out} · {b.room_id}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-[13px] font-bold text-slate-800">{formatMNT(b.total||0)}</div>
                    <div className="text-[11px] text-slate-400">{b.payment}</div>
                  </div>
                  <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${statusBadge(b.status)}`}>{statusLabel(b.status)}</span>
                  {expanded===b.id ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                </div>
              </div>

              {expanded===b.id && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    {[
                      ["И-мэйл", b.email||"—"],
                      ["Хүний тоо", b.guests],
                      ["Эмчилгээ", b.treatments?.join(", ")||"—"],
                      ["Бүртгэгдсэн", new Date(b.created_at).toLocaleDateString("mn-MN")],
                    ].map(([k,v]) => (
                      <div key={k as string}>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{k}</div>
                        <div className="text-[13px] text-slate-700 font-medium">{v}</div>
                      </div>
                    ))}
                  </div>
                  {b.notes && (
                    <div className="mb-4 p-3 bg-white rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Тэмдэглэл</div>
                      <div className="text-[13px] text-slate-600">{b.notes}</div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {b.status!=="confirmed"&&(
                      <button onClick={()=>updateStatus(b.id,"confirmed")}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer">
                        <Check size={13}/> Баталгаажуулах
                      </button>
                    )}
                    {b.status!=="cancelled"&&(
                      <button onClick={()=>updateStatus(b.id,"cancelled")}
                        className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer">
                        <X size={13}/> Цуцлах
                      </button>
                    )}
                    {b.status!=="pending"&&(
                      <button onClick={()=>updateStatus(b.id,"pending")}
                        className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer">
                        Хүлээгдэж буй болгох
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
