"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { formatMNT, rooms, services } from "@/lib/data";
import { Search, Download, Check, X, ChevronDown, ChevronUp, Filter, FileText, ExternalLink, User, Phone, Mail, Calendar, BedDouble, Stethoscope, CreditCard, StickyNote } from "lucide-react";

type Booking = {
  id: string; ref: string; fname: string; lname: string; phone: string;
  email: string; check_in: string; check_out: string; room_id: string;
  treatments: string[]; guests: number; notes: string; payment: string;
  total: number; status: string; created_at: string;
  ilgeeh_bichig_url: string | null;
};

export default function GuestsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"pending"|"confirmed"|"cancelled">("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", id);
    load();
  };

  const exportCSV = () => {
    const rows = [
      ["Дугаар","Нэр","Овог","Утас","И-мэйл","Өрөө","Ирэх","Явах","Хүн","Эмчилгээ","Нийт дүн","Төлбөр","Статус","Илгээх бичиг","Огноо"],
      ...filtered.map(b => [b.ref,b.fname,b.lname,b.phone,b.email||"",b.room_id,b.check_in,b.check_out,b.guests,(b.treatments||[]).join("|"),b.total,b.payment,b.status,b.ilgeeh_bichig_url||"",b.created_at]),
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
  const payLabel = (p: string) => p === "qpay" ? "QPay" : p === "card" ? "Карт" : p === "bank" ? "Банк" : "Бэлэн";

  const roomName = (id: string) => rooms.find(r => r.id === id)?.name.mn || id;
  const svcName = (id: string) => services.find(s => s.id === id)?.name.mn || id;

  const nights = (cin: string, cout: string) => {
    const d = Math.round((new Date(cout).getTime() - new Date(cin).getTime()) / 86400000);
    return d > 0 ? d : 0;
  };

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
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-slate-400"/>
          {(["all","pending","confirmed","cancelled"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-[12px] font-medium transition-colors cursor-pointer ${filter===f?"bg-teal text-white":"bg-white text-slate-400 border border-slate-200 hover:text-slate-600"}`}>
              {f==="all"?"Бүгд":f==="pending"?"Хүлээгдэж буй":f==="confirmed"?"Баталгаажсан":"Цуцлагдсан"}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[12px] text-slate-400">{filtered.length} үр дүн</div>

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
              {/* Row header */}
              <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(expanded===b.id?null:b.id)}>
                <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-teal font-semibold text-[14px]">{b.fname[0]}{b.lname[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-[14px]">{b.fname} {b.lname}</span>
                    <span className="text-[11px] font-mono text-teal bg-teal/10 px-2 py-0.5 rounded">{b.ref}</span>
                    {b.ilgeeh_bichig_url && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <FileText size={10}/> Илгээх бичиг
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-slate-400 mt-0.5">
                    {b.phone} · {b.check_in} → {b.check_out} · {roomName(b.room_id)}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-[13px] font-bold text-slate-800">{formatMNT(b.total||0)}</div>
                    <div className="text-[11px] text-slate-400">{payLabel(b.payment)}</div>
                  </div>
                  <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${statusBadge(b.status)}`}>{statusLabel(b.status)}</span>
                  {expanded===b.id ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded===b.id && (
                <div className="border-t border-slate-100 bg-slate-50/50">

                  {/* Detail grid */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Personal info */}
                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                      <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5"><User size={12}/>Хувийн мэдээлэл</h3>
                      <div className="space-y-2.5">
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400 flex items-center gap-1.5"><User size={11}/>Нэр</span><span className="text-[13px] font-medium text-slate-700">{b.fname} {b.lname}</span></div>
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400 flex items-center gap-1.5"><Phone size={11}/>Утас</span><a href={`tel:${b.phone}`} className="text-[13px] font-medium text-teal">{b.phone}</a></div>
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400 flex items-center gap-1.5"><Mail size={11}/>И-мэйл</span><span className="text-[13px] text-slate-700">{b.email||"—"}</span></div>
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400">Хүний тоо</span><span className="text-[13px] font-medium text-slate-700">{b.guests} хүн</span></div>
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400">Бүртгэгдсэн</span><span className="text-[13px] text-slate-700">{new Date(b.created_at).toLocaleString("mn-MN")}</span></div>
                      </div>
                    </div>

                    {/* Stay info */}
                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                      <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5"><Calendar size={12}/>Байрлалын мэдээлэл</h3>
                      <div className="space-y-2.5">
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400 flex items-center gap-1.5"><Calendar size={11}/>Ирэх өдөр</span><span className="text-[13px] font-medium text-slate-700">{b.check_in}</span></div>
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400 flex items-center gap-1.5"><Calendar size={11}/>Явах өдөр</span><span className="text-[13px] font-medium text-slate-700">{b.check_out}</span></div>
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400">Хоног</span><span className="text-[13px] font-medium text-teal">{nights(b.check_in, b.check_out)} шөнө</span></div>
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400 flex items-center gap-1.5"><BedDouble size={11}/>Өрөө</span><span className="text-[13px] font-medium text-slate-700">{roomName(b.room_id)}</span></div>
                      </div>
                    </div>

                    {/* Treatments */}
                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                      <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5"><Stethoscope size={12}/>Эмчилгээ</h3>
                      {b.treatments?.length > 0 ? (
                        <div className="space-y-1.5">
                          {b.treatments.map(id => (
                            <div key={id} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal shrink-0"/>
                              <span className="text-[13px] text-slate-700">{svcName(id)}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-[13px] text-slate-400">Эмчилгээ сонгоогүй</p>}
                    </div>

                    {/* Payment */}
                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                      <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5"><CreditCard size={12}/>Төлбөр</h3>
                      <div className="space-y-2.5">
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400">Төлбөрийн арга</span><span className="text-[13px] font-medium text-slate-700">{payLabel(b.payment)}</span></div>
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400">Нийт дүн</span><span className="text-[14px] font-bold text-teal">{formatMNT(b.total||0)}</span></div>
                        <div className="flex justify-between"><span className="text-[12px] text-slate-400">Статус</span><span className={`text-[12px] px-2.5 py-0.5 rounded-full font-medium ${statusBadge(b.status)}`}>{statusLabel(b.status)}</span></div>
                      </div>
                    </div>

                    {/* Notes */}
                    {b.notes && (
                      <div className="bg-white rounded-xl border border-slate-100 p-4 md:col-span-2">
                        <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5"><StickyNote size={12}/>Тэмдэглэл</h3>
                        <p className="text-[13px] text-slate-600 leading-relaxed">{b.notes}</p>
                      </div>
                    )}

                    {/* Ilgeeh bichig */}
                    <div className={`bg-white rounded-xl border p-4 md:col-span-2 ${b.ilgeeh_bichig_url ? "border-blue-100" : "border-slate-100"}`}>
                      <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5"><FileText size={12}/>Илгээх бичиг</h3>
                      {b.ilgeeh_bichig_url ? (
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <FileText size={20} className="text-blue-500"/>
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] font-medium text-slate-700">Илгээх бичиг байршуулсан</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{b.ilgeeh_bichig_url}</p>
                          </div>
                          <a
                            href={b.ilgeeh_bichig_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer shrink-0"
                          >
                            <ExternalLink size={13}/> Нээх
                          </a>
                        </div>
                      ) : (
                        <p className="text-[13px] text-slate-400 flex items-center gap-2">
                          <X size={14} className="text-slate-300"/> Илгээх бичиг оруулаагүй
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-5 pb-5 flex gap-2 flex-wrap">
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
                    <a href={`tel:${b.phone}`}
                      className="flex items-center gap-1.5 bg-teal/10 hover:bg-teal/20 text-teal px-4 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ml-auto">
                      <Phone size={13}/> {b.phone} руу залгах
                    </a>
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
