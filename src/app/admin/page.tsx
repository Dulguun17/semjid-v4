"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { LogOut, Calendar, Users, TrendingUp, Clock, Check, X, MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react";
import { formatMNT } from "@/lib/data";

type Booking = {
  id: string; ref: string; fname: string; lname: string; phone: string;
  email: string; check_in: string; check_out: string; room_id: string;
  treatments: string[]; guests: number; notes: string; payment: string;
  total: number; status: string; created_at: string;
};

type ChatSession = {
  session_id: string; sender_name: string; last_message: string;
  last_at: string; unread: number;
};

type ChatMessage = {
  id: string; session_id: string; sender: string;
  sender_name: string; message: string; created_at: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"bookings" | "chat">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.push("/admin/login");
  }, [router]);

  const loadBookings = useCallback(async () => {
    const { data } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  }, []);

  const loadSessions = useCallback(async () => {
    const { data } = await supabaseAdmin
      .from("chat_messages")
      .select("session_id, sender_name, message, created_at, sender")
      .order("created_at", { ascending: false });

    if (!data) return;

    const map = new Map<string, ChatSession>();
    data.forEach(m => {
      if (!map.has(m.session_id)) {
        map.set(m.session_id, {
          session_id: m.session_id,
          sender_name: m.sender_name,
          last_message: m.message,
          last_at: m.created_at,
          unread: m.sender === "client" ? 1 : 0,
        });
      } else if (m.sender === "client") {
        const s = map.get(m.session_id)!;
        s.unread += 1;
      }
    });
    setSessions(Array.from(map.values()));
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    const { data } = await supabaseAdmin
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }, []);

  useEffect(() => {
    checkAuth();
    loadBookings();
    loadSessions();
  }, [checkAuth, loadBookings, loadSessions]);

  useEffect(() => {
    if (activeSession) loadMessages(activeSession);
  }, [activeSession, loadMessages]);

  // Auto-refresh chat every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      loadSessions();
      if (activeSession) loadMessages(activeSession);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSession, loadSessions, loadMessages]);

  const updateStatus = async (id: string, status: string) => {
    await supabaseAdmin.from("bookings").update({ status }).eq("id", id);
    loadBookings();
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeSession) return;
    await fetch("/api/chat/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply, sessionId: activeSession }),
    });
    setReply("");
    loadMessages(activeSession);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    revenue: bookings.filter(b => b.status === "confirmed").reduce((s, b) => s + (b.total || 0), 0),
  };

  const statusColor = (s: string) =>
    s === "confirmed" ? "bg-green-100 text-green-700" :
    s === "cancelled" ? "bg-red-100 text-red-600" :
    "bg-amber-100 text-amber-700";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-teal text-white px-6 lg:px-10 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl">Admin Dashboard</h1>
          <p className="text-[11px] text-white/60">Сэмжид Хүжирт Рашаан Сувилал</p>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-[12px] text-white/70 hover:text-white transition-colors cursor-pointer">
          <LogOut size={15} /> Гарах
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Calendar, label: "Нийт захиалга", value: stats.total, color: "text-teal" },
            { icon: Clock, label: "Хүлээгдэж буй", value: stats.pending, color: "text-amber-500" },
            { icon: Check, label: "Баталгаажсан", value: stats.confirmed, color: "text-green-600" },
            { icon: TrendingUp, label: "Нийт орлого", value: formatMNT(stats.revenue), color: "text-teal" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm">
              <Icon size={18} className={`${color} mb-2`} />
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["bookings", "chat"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${tab === t ? "bg-teal text-white" : "bg-white text-slate-500 hover:text-slate-700"}`}>
              {t === "bookings" ? <span className="flex items-center gap-2"><Users size={14}/>Захиалгууд</span> : <span className="flex items-center gap-2"><MessageSquare size={14}/>Чат {sessions.filter(s=>s.unread>0).length > 0 && <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{sessions.filter(s=>s.unread>0).length}</span>}</span>}
            </button>
          ))}
        </div>

        {/* Bookings Tab */}
        {tab === "bookings" && (
          <div>
            {/* Filter */}
            <div className="flex gap-2 mb-4">
              {(["all","pending","confirmed","cancelled"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-[12px] transition-colors cursor-pointer ${filter === f ? "bg-teal text-white" : "bg-white text-slate-400 hover:text-slate-600"}`}>
                  {f === "all" ? "Бүгд" : f === "pending" ? "Хүлээгдэж буй" : f === "confirmed" ? "Баталгаажсан" : "Цуцлагдсан"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-20 text-slate-400">Ачаалж байна...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-400 bg-white rounded-xl">Захиалга байхгүй</div>
            ) : (
              <div className="space-y-3">
                {filtered.map(b => (
                  <div key={b.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium text-slate-800 text-[14px]">{b.fname} {b.lname}</div>
                          <div className="text-[12px] text-slate-400">{b.ref} · {b.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                          <div className="text-[13px] font-semibold text-teal">{formatMNT(b.total || 0)}</div>
                          <div className="text-[11px] text-slate-400">{b.check_in} → {b.check_out}</div>
                        </div>
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${statusColor(b.status)}`}>
                          {b.status === "pending" ? "Хүлээгдэж буй" : b.status === "confirmed" ? "Баталгаажсан" : "Цуцлагдсан"}
                        </span>
                        {expanded === b.id ? <ChevronUp size={15} className="text-slate-400"/> : <ChevronDown size={15} className="text-slate-400"/>}
                      </div>
                    </div>

                    {expanded === b.id && (
                      <div className="border-t border-slate-100 p-5 bg-slate-50">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-[13px]">
                          <div><span className="text-slate-400">И-мэйл:</span> <span className="text-slate-700">{b.email || "—"}</span></div>
                          <div><span className="text-slate-400">Өрөө:</span> <span className="text-slate-700">{b.room_id}</span></div>
                          <div><span className="text-slate-400">Хүний тоо:</span> <span className="text-slate-700">{b.guests}</span></div>
                          <div><span className="text-slate-400">Төлбөр:</span> <span className="text-slate-700">{b.payment}</span></div>
                          <div><span className="text-slate-400">Эмчилгээ:</span> <span className="text-slate-700">{b.treatments?.join(", ") || "—"}</span></div>
                          <div><span className="text-slate-400">Огноо:</span> <span className="text-slate-700">{new Date(b.created_at).toLocaleDateString("mn-MN")}</span></div>
                        </div>
                        {b.notes && <div className="text-[13px] text-slate-500 mb-4 bg-white p-3 rounded-lg"><strong>Тэмдэглэл:</strong> {b.notes}</div>}
                        <div className="flex gap-2">
                          {b.status !== "confirmed" && (
                            <button onClick={() => updateStatus(b.id, "confirmed")}
                              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer">
                              <Check size={13}/> Баталгаажуулах
                            </button>
                          )}
                          {b.status !== "cancelled" && (
                            <button onClick={() => updateStatus(b.id, "cancelled")}
                              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer">
                              <X size={13}/> Цуцлах
                            </button>
                          )}
                          {b.status !== "pending" && (
                            <button onClick={() => updateStatus(b.id, "pending")}
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
        )}

        {/* Chat Tab */}
        {tab === "chat" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ height: "60vh" }}>
            {/* Sessions list */}
            <div className="bg-white rounded-xl shadow-sm overflow-y-auto">
              <div className="p-4 border-b border-slate-100 text-[12px] font-medium text-slate-500 uppercase tracking-wider">Харилцагчид</div>
              {sessions.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-[13px]">Чат байхгүй</div>
              ) : sessions.map(s => (
                <div key={s.session_id} onClick={() => setActiveSession(s.session_id)}
                  className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${activeSession === s.session_id ? "bg-teal/5 border-l-2 border-l-teal" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-slate-700">{s.sender_name}</span>
                    {s.unread > 0 && <span className="bg-teal text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">{s.unread}</span>}
                  </div>
                  <p className="text-[12px] text-slate-400 truncate">{s.last_message}</p>
                </div>
              ))}
            </div>

            {/* Chat window */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm flex flex-col">
              {!activeSession ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-[13px]">
                  <div className="text-center">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-30"/>
                    Харилцагч сонгоно уу
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-slate-100 text-[13px] font-medium text-slate-700">
                    {sessions.find(s => s.session_id === activeSession)?.sender_name || "Зочин"}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-[13px] ${m.sender === "admin" ? "bg-teal text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm"}`}>
                          <p>{m.message}</p>
                          <p className={`text-[10px] mt-1 ${m.sender === "admin" ? "text-white/60" : "text-slate-400"}`}>
                            {new Date(m.created_at).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-slate-100 flex gap-2">
                    <input
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendReply()}
                      placeholder="Хариу бичнэ үү..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-teal"
                    />
                    <button onClick={sendReply}
                      className="bg-teal hover:bg-teal-dark text-white px-4 py-2.5 rounded-lg transition-colors cursor-pointer">
                      <Send size={15}/>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
