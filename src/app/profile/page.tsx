"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/lang-context";
import { User, LogOut, CalendarDays, Phone, Mail, ArrowRight } from "lucide-react";
import { formatMNT, rooms, roomInstances } from "@/lib/data";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type Booking = {
  id: string;
  ref: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total: number;
  payment: string;
  status: string;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { lang } = useLang();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUser(data.session.user);
      setChecking(false);

      // Fetch bookings for this user by email
      const email = data.session.user.email;
      if (email) {
        const { data: bData } = await supabase
          .from("bookings")
          .select("id, ref, room_id, check_in, check_out, guests, total, payment, status, created_at")
          .eq("email", email)
          .order("created_at", { ascending: false });
        setBookings(bData || []);
      }
      setLoadingBookings(false);
    });
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getRoomName = (roomId: string) => {
    const instance = roomInstances.find(r => r.id === roomId);
    const category = instance ? rooms.find(r => r.id === instance.categoryId) : null;
    return category ? category.name[lang] : roomId;
  };

  const statusColor = (status: string) => {
    if (status === "confirmed") return "bg-green-100 text-green-700";
    if (status === "cancelled") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, { mn: string; en: string }> = {
      pending:   { mn: "Хүлээгдэж байна", en: "Pending" },
      confirmed: { mn: "Баталгаажсан",    en: "Confirmed" },
      cancelled: { mn: "Цуцлагдсан",      en: "Cancelled" },
    };
    return labels[status]?.[lang] || status;
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const meta = user?.user_metadata || {};
  const firstName = meta.first_name || "";
  const lastName  = meta.last_name  || "";
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || user?.email || "";
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || (user?.email?.[0] || "U").toUpperCase();

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-teal py-14 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-serif">
              {initials}
            </div>
            <div>
              <h1 className="font-serif text-[clamp(22px,3vw,36px)] text-white">{fullName}</h1>
              <p className="text-[13px] text-white/60 mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 text-[13px] text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            {lang === "mn" ? "Гарах" : "Sign Out"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-[11px] tracking-[0.2em] uppercase text-slate-400 mb-5">
              {lang === "mn" ? "Хувийн мэдээлэл" : "Account Info"}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User size={15} className="text-teal mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[11px] text-slate-400">{lang === "mn" ? "Нэр" : "Name"}</div>
                  <div className="text-[14px] text-slate-700">{fullName || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={15} className="text-teal mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[11px] text-slate-400">{lang === "mn" ? "И-мэйл" : "Email"}</div>
                  <div className="text-[14px] text-slate-700 break-all">{user?.email}</div>
                </div>
              </div>
              {meta.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={15} className="text-teal mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] text-slate-400">{lang === "mn" ? "Утас" : "Phone"}</div>
                    <div className="text-[14px] text-slate-700">{meta.phone}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 text-[13px] font-medium bg-teal hover:bg-teal-dark text-white px-5 py-2.5 rounded-lg no-underline transition-colors w-full justify-center"
              >
                {lang === "mn" ? "Захиалга өгөх" : "Book a Room"} <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-[11px] tracking-[0.2em] uppercase text-slate-400 mb-5">
              {lang === "mn" ? "Миний захиалгууд" : "My Bookings"}
            </h2>

            {loadingBookings ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays size={40} className="text-slate-200 mx-auto mb-3" />
                <p className="text-[14px] text-slate-400">
                  {lang === "mn" ? "Одоогоор захиалга байхгүй байна." : "No bookings yet."}
                </p>
                <Link href="/booking" className="inline-block mt-4 text-[13px] text-teal hover:text-teal-dark transition-colors">
                  {lang === "mn" ? "Захиалга өгөх →" : "Make a booking →"}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.id} className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-[13px] font-medium text-slate-800">{getRoomName(b.room_id)}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">#{b.ref}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${statusColor(b.status)}`}>
                        {statusLabel(b.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={11} />
                        {b.check_in} → {b.check_out}
                      </span>
                      <span>{b.guests} {lang === "mn" ? "хүн" : "guests"}</span>
                      <span className="font-medium text-teal">{formatMNT(b.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
