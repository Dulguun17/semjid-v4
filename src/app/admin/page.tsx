"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatMNT } from "@/lib/data";
import { Calendar, TrendingUp, Clock, CheckCircle, XCircle, ArrowUpRight, Loader2 } from "lucide-react";

type Booking = {
  id: string;
  ref: string;
  fname: string;
  lname: string;
  phone: string;
  email: string | null;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total: number;
  status: string;
  created_at: string;
};

type Message = {
  id: string;
  session_id: string;
  sender: string;
  sender_name: string;
  message: string;
  created_at: string;
};

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
      setBookings(data || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    }
    setLoading(false);
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await supabase.from("chat_messages").select("session_id").order("created_at", { ascending: false });
      if (data) {
        const unique = Array.from(new Set(data.map(item => item.session_id)));
        setSessions(unique);
      }
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    }
  }, []);

  useEffect(() => {
    loadBookings();
    loadSessions();
  }, [loadBookings, loadSessions]);

  const confirmed = bookings.filter(b => b.status === "confirmed");
  const pending = bookings.filter(b => b.status === "pending");
  const cancelled = bookings.filter(b => b.status === "cancelled");
  const revenue = confirmed.reduce((sum, b) => sum + (b.total || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-2">Manage bookings, content, and chat sessions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/content" className="px-4 py-2 rounded-xl bg-teal text-white text-sm hover:bg-teal-dark">
            Content Editor
          </Link>
          <Link href="/admin/guests" className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm hover:bg-slate-200">
            Guests List
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Bookings</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{bookings.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Pending Bookings</div>
          <div className="mt-3 text-3xl font-semibold text-amber-600">{pending.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Confirmed Revenue</div>
          <div className="mt-3 text-3xl font-semibold text-teal">{formatMNT(revenue)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Bookings</h2>
              <p className="text-sm text-slate-500">Latest bookings from the database.</p>
            </div>
            <Link href="/admin/guests" className="text-sm text-teal hover:underline flex items-center gap-2">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-teal"/></div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No bookings available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-[0.12em] text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Ref</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Check-in</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.slice(0, 8).map(booking => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-700">{booking.ref}</td>
                      <td className="px-4 py-3">{booking.fname} {booking.lname}</td>
                      <td className="px-4 py-3">{booking.room_id}</td>
                      <td className="px-4 py-3">{booking.check_in}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-[11px] ${booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : booking.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>{booking.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Chat Sessions</h2>
            <p className="text-sm text-slate-500">Recent customer chat session IDs.</p>
          </div>
          <div className="space-y-3">
            {sessions.slice(0, 6).map(session => (
              <div key={session} className="rounded-2xl bg-slate-50 p-4 text-slate-700 text-sm break-all">{session}</div>
            ))}
            {sessions.length === 0 && <div className="text-slate-400">No chat sessions yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
