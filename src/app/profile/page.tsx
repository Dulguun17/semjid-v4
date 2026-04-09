"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/lang-context";
import { User, LogOut, CalendarDays, Phone, Mail, ArrowRight, Edit2, Save, X, Check, Heart } from "lucide-react";
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const currentUser = data.session.user;
      setUser(currentUser);
      const meta = currentUser.user_metadata || {};
      setFormData({
        firstName: meta.first_name || "",
        lastName: meta.last_name || "",
        phone: currentUser.phone || meta.phone || "",
      });
      setChecking(false);

      // Fetch bookings for this user by email
      const email = currentUser.email;
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

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        },
      });
      setSuccessMessage(lang === "mn" ? "Профайл амжилттай хадгалагдлаа" : "Profile saved successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const getRoomName = (roomId: string) => {
    const instance = roomInstances.find(r => r.id === roomId);
    const category = instance ? rooms.find(r => r.id === instance.categoryId) : null;
    return category ? category.name[lang] : roomId;
  };

  const statusColor = (status: string) => {
    if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
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
  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ") || user?.email || "";
  const initials = [formData.firstName?.[0], formData.lastName?.[0]].filter(Boolean).join("").toUpperCase() || (user?.email?.[0] || "U").toUpperCase();

  const labels = {
    profile: { mn: "Миний профайл", en: "My Profile" },
    email: { mn: "И-мэйл", en: "Email" },
    phone: { mn: "Утас", en: "Phone" },
    firstName: { mn: "Нэр", en: "First Name" },
    lastName: { mn: "Овог", en: "Last Name" },
    editProfile: { mn: "Профайл засах", en: "Edit Profile" },
    save: { mn: "Хадгалах", en: "Save" },
    cancel: { mn: "Цуцлах", en: "Cancel" },
    signOut: { mn: "Гарах", en: "Sign Out" },
    bookings: { mn: "Миний захиалгууд", en: "My Bookings" },
    noBookings: { mn: "Та захиалга хийээгүй байна", en: "No bookings yet" },
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal to-teal-dark py-12 px-6 lg:px-10 text-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-teal-900 flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{fullName}</h1>
              <p className="text-teal-100 text-sm mt-1">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
          >
            <LogOut size={18} /> {labels.signOut[lang]}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2">
            <Check size={20} /> {successMessage}
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{labels.profile[lang]}</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition"
              >
                <Edit2 size={18} /> {labels.editProfile[lang]}
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    {labels.firstName[lang]}
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    {labels.lastName[lang]}
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  {labels.email[lang]}
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  {labels.phone[lang]}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition disabled:opacity-50"
                >
                  <Save size={18} /> {labels.save[lang]}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  <X size={18} /> {labels.cancel[lang]}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">{labels.firstName[lang]}</p>
                <p className="text-lg font-semibold text-slate-900">{formData.firstName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">{labels.lastName[lang]}</p>
                <p className="text-lg font-semibold text-slate-900">{formData.lastName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">{labels.email[lang]}</p>
                <p className="text-lg font-semibold text-slate-900 truncate">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">{labels.phone[lang]}</p>
                <p className="text-lg font-semibold text-slate-900">{formData.phone || "-"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bookings Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{labels.bookings[lang]}</h2>

          {loadingBookings ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-slate-400 py-12">{labels.noBookings[lang]}</p>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border border-slate-200 rounded-lg p-4 hover:border-teal transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-teal font-bold">{booking.ref}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor(booking.status)}`}>
                          {statusLabel(booking.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{lang === "mn" ? "Өрөө" : "Room"}</p>
                          <p className="font-semibold text-slate-900">{getRoomName(booking.room_id)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{lang === "mn" ? "Огноо" : "Dates"}</p>
                          <p className="font-semibold text-slate-900">
                            {new Date(booking.check_in).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US")} -{" "}
                            {new Date(booking.check_out).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US")}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{lang === "mn" ? "Зочид" : "Guests"}</p>
                          <p className="font-semibold text-slate-900">{booking.guests}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{lang === "mn" ? "Дүн" : "Total"}</p>
                          <p className="font-bold text-teal">{formatMNT(booking.total)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
