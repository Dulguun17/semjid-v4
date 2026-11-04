"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowUpRight, Calendar, Loader2, MessageSquare, Users } from "lucide-react";

type Booking = {
  id: string;
  ref: string;
  fname: string;
  lname: string;
  room_id: string;
  check_in: string;
  status: string;
  created_at: string;
};

export default function StaffDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    const loadWorkspace = async () => {
      try {
        const [{ data: bookingData, error: bookingError }, { data: chatData, error: chatError }] =
          await Promise.all([
            supabase
              .from("bookings")
              .select("id, ref, fname, lname, room_id, check_in, status, created_at")
              .order("created_at", { ascending: false })
              .limit(8),
            supabase.from("chat_messages").select("session_id"),
          ]);
        if (!active) return;

        if (bookingError || chatError) {
          console.error("Failed to load staff workspace", bookingError || chatError);
          setLoadError("Ажилтны мэдээллийг ачаалж чадсангүй. Эрх болон өгөгдлийн сангийн тохиргоог шалгана уу.");
        } else {
          setBookings(bookingData || []);
          setSessionCount(new Set((chatData || []).map(message => message.session_id)).size);
        }
      } catch (error) {
        if (!active) return;
        console.error("Failed to load staff workspace", error);
        setLoadError("Ажилтны мэдээллийг ачаалж чадсангүй.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadWorkspace();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ажилтны ажлын самбар</h1>
        <p className="mt-2 text-sm text-slate-500">Захиалга, үйлчлүүлэгч, өрөөний хүртээмж болон мессежийн ажлын урсгал.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/bookings/manage" className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm no-underline hover:border-teal">
          <Calendar className="text-teal" size={20} />
          <div className="mt-4 text-2xl font-semibold">{loading ? "—" : bookings.length}</div>
          <div className="mt-1 text-sm text-slate-500">Сүүлийн захиалгууд</div>
        </Link>
        <Link href="/admin/guests" className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm no-underline hover:border-teal">
          <Users className="text-teal" size={20} />
          <div className="mt-4 text-sm font-semibold">Үйлчлүүлэгчийн бүртгэл</div>
          <div className="mt-1 text-sm text-slate-500">Холбоо барих мэдээлэл</div>
        </Link>
        <Link href="/admin/chat" className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm no-underline hover:border-teal">
          <MessageSquare className="text-teal" size={20} />
          <div className="mt-4 text-2xl font-semibold">{loading ? "—" : sessionCount}</div>
          <div className="mt-1 text-sm text-slate-500">Чатын яриа</div>
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Сүүлийн захиалгууд</h2>
            <p className="text-sm text-slate-500">Энд мөнгөн дүн, төлбөр хүлээн авсан дүнг харуулахгүй.</p>
          </div>
          <Link href="/admin/bookings/manage" className="flex items-center gap-2 text-sm text-teal hover:underline">
            Бүх захиалга <ArrowUpRight size={14} />
          </Link>
        </div>

        {loadError ? (
          <p role="alert" className="py-8 text-center text-sm text-red-600">{loadError}</p>
        ) : loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-teal" /></div>
        ) : bookings.length === 0 ? (
          <p className="py-10 text-center text-slate-400">Захиалга байхгүй.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Дугаар</th>
                  <th className="px-4 py-3">Үйлчлүүлэгч</th>
                  <th className="px-4 py-3">Өрөө</th>
                  <th className="px-4 py-3">Ирэх өдөр</th>
                  <th className="px-4 py-3">Төлөв</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 font-mono">{booking.ref}</td>
                    <td className="px-4 py-3">{booking.fname} {booking.lname}</td>
                    <td className="px-4 py-3">{booking.room_id}</td>
                    <td className="px-4 py-3">{booking.check_in}</td>
                    <td className="px-4 py-3">{booking.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
