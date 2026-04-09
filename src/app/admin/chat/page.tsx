"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, MessageSquare, RefreshCw } from "lucide-react";

type Message = { id: string; session_id: string; sender: string; sender_name: string; message: string; created_at: string; };
type Session = { session_id: string; sender_name: string; last_message: string; last_at: string; client_count: number; };

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string|null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    const { data } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: false });
    if (!data) return;
    const map = new Map<string, Session>();
    data.forEach(m => {
      if (!map.has(m.session_id)) {
        map.set(m.session_id, { session_id: m.session_id, sender_name: m.sender_name, last_message: m.message, last_at: m.created_at, client_count: 0 });
      }
      if (m.sender === "client") {
        map.get(m.session_id)!.client_count += 1;
      }
    });
    setSessions(Array.from(map.values()));
  }, []);

  const loadMessages = useCallback(async (sid: string) => {
    const { data } = await supabase.from("chat_messages").select("*").eq("session_id", sid).order("created_at", { ascending: true });
    setMessages(data || []);
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    if (activeSession) loadMessages(activeSession);
  }, [activeSession, loadMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadSessions();
      if (activeSession) loadMessages(activeSession);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeSession, loadSessions, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendReply = async () => {
    if (!reply.trim() || !activeSession || sending) return;
    setSending(true);
    await fetch("/api/chat/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply.trim(), sessionId: activeSession }),
    });
    setReply("");
    await loadMessages(activeSession);
    setSending(false);
  };

  const activeSessionData = sessions.find(s => s.session_id === activeSession);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Чат</h1>
          <p className="text-[13px] text-slate-400 mt-1">Зочидтой харилцах</p>
        </div>
        <button onClick={loadSessions} className="flex items-center gap-2 text-[12px] text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl transition-colors cursor-pointer">
          <RefreshCw size={13}/> Шинэчлэх
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 240px)", minHeight: "500px" }}>
        <div className="flex h-full">
          {/* Sessions sidebar */}
          <div className="w-72 border-r border-slate-100 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Харилцагчид ({sessions.length})</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare size={28} className="mx-auto mb-2 text-slate-300"/>
                  <p className="text-[12px] text-slate-400">Чат байхгүй</p>
                </div>
              ) : sessions.map(s => (
                <div key={s.session_id} onClick={() => setActiveSession(s.session_id)}
                  className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${activeSession===s.session_id?"bg-teal/5 border-l-2 border-l-teal":""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-teal/10 rounded-full flex items-center justify-center">
                        <span className="text-teal text-[11px] font-bold">{s.sender_name[0]}</span>
                      </div>
                      <span className="text-[13px] font-medium text-slate-700">{s.sender_name}</span>
                    </div>
                    {s.client_count > 0 && (
                      <span className="bg-teal text-white text-[9px] rounded-full w-5 h-5 flex items-center justify-center shrink-0">{s.client_count}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate pl-10">{s.last_message}</p>
                  <p className="text-[10px] text-slate-300 mt-1 pl-10">{new Date(s.last_at).toLocaleTimeString("mn-MN", { hour:"2-digit", minute:"2-digit" })}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeSession ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={40} className="mx-auto mb-3 text-slate-200"/>
                  <p className="text-[14px] text-slate-400">Харилцагч сонгоно уу</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-teal/10 rounded-full flex items-center justify-center">
                    <span className="text-teal text-[12px] font-bold">{activeSessionData?.sender_name[0]}</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800">{activeSessionData?.sender_name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"/>
                      Онлайн
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender==="admin"?"justify-end":"justify-start"}`}>
                      <div className={`max-w-sm ${m.sender==="admin"?"items-end":"items-start"} flex flex-col`}>
                        <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${m.sender==="admin"?"bg-teal text-white rounded-tr-sm":"bg-slate-100 text-slate-700 rounded-tl-sm"}`}>
                          {m.message}
                        </div>
                        <div className={`text-[10px] mt-1 ${m.sender==="admin"?"text-slate-400":"text-slate-300"}`}>
                          {m.sender==="admin"?"Та":"Зочин"} · {new Date(m.created_at).toLocaleTimeString("mn-MN", { hour:"2-digit", minute:"2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef}/>
                </div>

                {/* Reply input */}
                <div className="p-4 border-t border-slate-100">
                  <div className="flex gap-3">
                    <input
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => e.key==="Enter" && !e.shiftKey && sendReply()}
                      placeholder="Хариу бичнэ үү... (Enter = илгээх)"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-teal transition-colors"
                    />
                    <button onClick={sendReply} disabled={sending||!reply.trim()}
                      className="bg-teal hover:bg-teal-dark text-white px-5 py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
                      <Send size={16}/>
                      {sending?"...":"Илгээх"}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Зочин 4 секунд тутамд шинэ мессеж авна</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
