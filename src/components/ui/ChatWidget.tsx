"use client";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { useLang } from "@/lib/lang-context";

type Message = { id?: string; sender: string; message: string; created_at?: string; };

function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("chat_session");
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("chat_session", id);
  }
  return id;
}

function getName() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("chat_name") || "";
}

export function ChatWidget() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(getSessionId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const labels = {
    title:       { mn: "Холбоо барих", en: "Live Chat" },
    subtitle:    { mn: "Сувилалын ажилтан", en: "Resort Staff" },
    placeholder: { mn: "Мессеж бичнэ үү...", en: "Type a message..." },
    namePlaceholder: { mn: "Таны нэр", en: "Your name" },
    nameBtn:     { mn: "Үргэлжлүүлэх", en: "Continue" },
    welcome:     { mn: "Сайн байна уу! Та асуулт байвал бичнэ үү. Бид удахгүй хариу өгнө.", en: "Hello! Feel free to ask us anything. We'll respond shortly." },
    online:      { mn: "Онлайн", en: "Online" },
  };

  useEffect(() => {
    const savedName = getName();
    if (savedName) { setName(savedName); setNameSet(true); }
  }, []);

  useEffect(() => {
    if (!open || !nameSet) return;
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [open, nameSet]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
  };

  const handleSetName = () => {
    if (!name.trim()) return;
    localStorage.setItem("chat_name", name.trim());
    setNameSet(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setLoading(true);
    setMessages(prev => [...prev, { sender: "client", message: msg }]);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId, senderName: name }),
      });
      loadMessages();
    } catch {}
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-teal hover:bg-teal-dark text-white rounded-full shadow-lg shadow-teal/30 flex items-center justify-center transition-all cursor-pointer"
        aria-label="Chat"
      >
        {open ? <X size={22}/> : <MessageSquare size={22}/>}
        {!open && messages.filter(m=>m.sender==="admin").length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center">!</span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{height:"420px"}}>
          {/* Header */}
          <div className="bg-teal px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare size={15} className="text-white"/>
            </div>
            <div>
              <div className="text-white text-[13px] font-semibold">{labels.title[lang]}</div>
              <div className="text-[10px] text-white/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"/>
                {labels.online[lang]}
              </div>
            </div>
          </div>

          {/* Name input */}
          {!nameSet ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3">
              <MessageSquare size={32} className="text-teal/30"/>
              <p className="text-[13px] text-slate-500 text-center">{labels.welcome[lang]}</p>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSetName()}
                placeholder={labels.namePlaceholder[lang]}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-teal"
              />
              <button
                onClick={handleSetName}
                className="w-full bg-teal hover:bg-teal-dark text-white py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
              >
                {labels.nameBtn[lang]}
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                    <p className="text-[13px] text-slate-600">{labels.welcome[lang]}</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === "client" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] ${m.sender === "client" ? "bg-teal text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm"}`}>
                      {m.message}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef}/>
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-100 flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={labels.placeholder[lang]}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-teal"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-teal hover:bg-teal-dark text-white p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
