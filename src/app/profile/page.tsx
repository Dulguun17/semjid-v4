"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/lang-context";
import { LogOut, Edit2, Save, X, Check, Star } from "lucide-react";
import { formatMNT, PHONE1, rooms, roomInstances } from "@/lib/data";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { workspaceAuthorizationHeaders } from "@/lib/workspace-api";
import { formatMntAmount } from "@/lib/payment-ledger";
import { BookingPaymentInstructions } from "@/components/ui/BookingPaymentInstructions";
import { customerBookingStatusLabel } from "@/lib/customer-booking";

type Booking = {
  id: string;
  ref: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total: number;
  status: string;
  created_at: string;
  beds: string[];
  expires_at: string | null;
  financials: { completedPayments: string; completedRefunds: string; netReceived: string; pendingPayments: string; remainingBalance: string | null; completeHistory: boolean };
};

type BookingFeedback = {
  id: string;
  booking_id: string;
  room_id: string | null;
  check_in: string;
  check_out: string;
  room_rating: number;
  service_rating: number;
  comment: string | null;
  submitted_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { lang } = useLang();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<"customer" | "staff" | "ceo" | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState("");
  const [feedback, setFeedback] = useState<BookingFeedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [feedbackError, setFeedbackError] = useState("");
  const [reviewingBookingId, setReviewingBookingId] = useState<string | null>(null);
  const [roomRating, setRoomRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSubmitError, setFeedbackSubmitError] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const [checking, setChecking] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const loadCustomerData = useCallback(async (isActive: () => boolean = () => true) => {
    setLoadingBookings(true);
    setLoadingFeedback(true);
    setBookingsError("");
    setFeedbackError("");

    try {
      const { data: role, error } = await supabase.rpc("get_workspace_role");
      if (!isActive()) return;
      if (error || !["customer", "staff", "ceo"].includes(role)) throw new Error("Role unavailable");
      setWorkspaceRole(role);
      if (role !== "customer") {
        setBookings([]);
        setFeedback([]);
        setLoadingBookings(false);
        setLoadingFeedback(false);
        return;
      }
    } catch {
      if (!isActive()) return;
      setLoadingBookings(false);
      setLoadingFeedback(false);
      setBookingsError(lang === "mn" ? "Бүртгэлийн эрхийг шалгаж чадсангүй. Дахин оролдоно уу." : "Your account access could not be verified. Please retry.");
      setFeedbackError(lang === "mn" ? "Бүртгэлийн эрхийг шалгаж чадсангүй." : "Your account access could not be verified.");
      return;
    }

    try {
      const response = await fetch("/api/customer/bookings", { headers: await workspaceAuthorizationHeaders(), cache: "no-store" });
      const result = await response.json();
      if (!isActive()) return;
      if (!response.ok || !Array.isArray(result.bookings)) throw new Error("Booking details unavailable");
      setBookings(result.bookings);
    } catch {
      if (!isActive()) return;
      setBookingsError(lang === "mn"
        ? "Захиалгыг ачаалж чадсангүй. Дахин оролдоно уу."
        : "Your bookings could not be loaded. Please try again.");
    }
    setLoadingBookings(false);

    try {
      const response = await fetch("/api/customer/feedback", {
        headers: await workspaceAuthorizationHeaders(),
        cache: "no-store",
      });
      if (!isActive()) return;
      const result = await response.json() as { feedback?: BookingFeedback[] };
      if (!response.ok || !Array.isArray(result.feedback)) throw new Error("Feedback could not be loaded.");
      setFeedback(result.feedback);
    } catch {
      if (isActive()) {
        console.error("Failed to load customer feedback");
        setFeedbackError(lang === "mn"
          ? "Сэтгэгдлийг ачаалж чадсангүй. Дахин оролдоно уу."
          : "Your feedback could not be loaded. Please try again.");
      }
    } finally {
      if (isActive()) setLoadingFeedback(false);
    }
  }, [lang]);

  useEffect(() => {
    let active = true;
    let expectedUserId: string | null = null;
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (expectedUserId && session?.user.id !== expectedUserId)) {
        active = false;
        setBookings([]);
        setFeedback([]);
        setUser(null);
        setWorkspaceRole(null);
        setFormData({ firstName: "", lastName: "", phone: "" });
        setChecking(true);
        router.replace("/login");
      }
    });
    const loadProfile = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) {
          router.replace("/login");
          return;
        }
        const currentUser = data.session.user;
        expectedUserId = currentUser.id;
        if (!active) return;
        setUser(currentUser);
        const meta = currentUser.user_metadata || {};
        setFormData({
          firstName: meta.first_name || "",
          lastName: meta.last_name || "",
          phone: currentUser.phone || meta.phone || "",
        });
        setChecking(false);
        await loadCustomerData(() => active);
      } catch {
        console.error("Failed to load customer profile");
        if (active) {
          setLoadingBookings(false);
          setLoadingFeedback(false);
          setBookingsError(lang === "mn"
            ? "Захиалгын мэдээллийг аюулгүйгээр ачаалж чадсангүй. Дахин оролдоно уу."
            : "Your booking history could not be loaded securely. Please try again.");
          setFeedbackError(lang === "mn"
            ? "Сэтгэгдлийг ачаалж чадсангүй. Дахин оролдоно уу."
            : "Your feedback could not be loaded. Please try again.");
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };
    void loadProfile();
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [lang, loadCustomerData, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        },
      });
      if (error) throw error;
      setSuccessMessage(lang === "mn" ? "Профайл амжилттай хадгалагдлаа" : "Profile saved successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      setEditing(false);
    } catch {
      console.error("Failed to save customer profile");
      setSaveError(lang === "mn" ? "Профайл хадгалахад алдаа гарлаа." : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const submitFeedback = async (bookingId: string) => {
    if (!roomRating || !serviceRating) {
      setFeedbackSubmitError(lang === "mn"
        ? "Өрөө болон үйлчилгээний үнэлгээг сонгоно уу."
        : "Choose ratings for both room and service.");
      return;
    }
    setSavingFeedback(true);
    setFeedbackSubmitError("");
    setFeedbackNotice("");
    try {
      const response = await fetch("/api/customer/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...await workspaceAuthorizationHeaders() },
        body: JSON.stringify({
          bookingId,
          roomRating,
          serviceRating,
          comment: feedbackComment,
        }),
      });
      const result = await response.json() as { feedback?: BookingFeedback };
      if (response.status === 409 && user) {
        await loadCustomerData();
        setReviewingBookingId(null);
        setFeedbackNotice(lang === "mn"
          ? "Энэ буудлын үнэлгээг аль хэдийн илгээсэн байна. Хадгалсан үнэлгээг доор харууллаа."
          : "You have already rated this stay. Your saved feedback is shown below.");
        return;
      }
      if (!response.ok || !result.feedback) throw new Error("Feedback could not be saved.");
      setFeedback(current => [result.feedback!, ...current]);
      setReviewingBookingId(null);
      setRoomRating(0);
      setServiceRating(0);
      setFeedbackComment("");
      setFeedbackNotice(lang === "mn" ? "Үнэлгээ амжилттай хадгалагдлаа." : "Your feedback has been saved.");
    } catch {
      console.error("Failed to submit customer feedback");
      setFeedbackSubmitError(lang === "mn"
        ? "Сэтгэгдэл хадгалагдсангүй. Дахин оролдоно уу."
        : "Feedback was not saved. Please try again.");
    } finally {
      setSavingFeedback(false);
    }
  };

  const openFeedbackForm = (bookingId: string) => {
    setReviewingBookingId(bookingId);
    setRoomRating(0);
    setServiceRating(0);
    setFeedbackComment("");
    setFeedbackSubmitError("");
    setFeedbackNotice("");
  };

  const renderRatingInput = (label: string, value: number, setValue: (rating: number) => void) => (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">{label}</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(rating => (
          <button
            key={rating}
            type="button"
            aria-label={`${label}: ${rating}/5`}
            aria-pressed={value === rating}
            disabled={savingFeedback}
            onClick={() => setValue(rating)}
            className="rounded p-1 text-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal disabled:opacity-50"
          >
            <Star size={24} fill={rating <= value ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    </fieldset>
  );

  const getRoomName = (roomId: string) => {
    const instance = roomInstances.find(r => r.id === roomId);
    const category = instance ? rooms.find(r => r.id === instance.categoryId) : null;
    return category ? category.name[lang] : roomId;
  };

  const statusColor = (status: string) => {
    if (status === "confirmed" || status === "checked_in") return "bg-emerald-100 text-emerald-700";
    if (status === "checked_out") return "bg-slate-100 text-slate-700";
    if (status === "cancelled" || status === "no_show") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  const statusLabel = (status: string) => {
    return customerBookingStatusLabel(status, lang);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
    noBookings: { mn: "Энэ бүртгэлтэй холбоос бүхий захиалга алга.", en: "No bookings are linked to this account." },
    retry: { mn: "Дахин оролдох", en: "Retry" },
    support: { mn: "Захиалгаа хүлээж байсан бол бидэнтэй холбогдоно уу:", en: "Expecting a booking? Contact support:" },
    myFeedback: { mn: "Миний сэтгэгдэл", en: "My Feedback" },
    rateStay: { mn: "Буудлаа үнэлэх", en: "Rate your stay" },
    roomRating: { mn: "Өрөө", en: "Room" },
    serviceRating: { mn: "Үйлчилгээ", en: "Service" },
    comment: { mn: "Сэтгэгдэл (заавал биш)", en: "Comment (optional)" },
    submitFeedback: { mn: "Үнэлгээ илгээх", en: "Submit feedback" },
    submitted: { mn: "Илгээсэн огноо", en: "Submitted" },
    unknownRoom: { mn: "Өрөөний мэдээлэл алга", en: "Room not recorded" },
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal to-teal-dark py-12 px-6 lg:px-10 text-white">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-5">
            <div className="w-16 h-16 shrink-0 rounded-full bg-teal-900 flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold sm:text-3xl">{fullName}</h1>
              <p className="break-all text-teal-100 text-sm mt-1">{user?.email}</p>
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
        {saveError && <p role="alert" className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{saveError}</p>}

        {/* Profile Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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
        {workspaceRole === "staff" || workspaceRole === "ceo" ? (
          <section role="status" className="rounded-2xl border border-teal/20 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{lang === "mn" ? "Ажлын бүртгэл" : "Work account"}</h2>
            <p className="mt-3 text-slate-600">{lang === "mn" ? "Та ажлын бүртгэлээр нэвтэрсэн байна. Хувийн захиалга болон сэтгэгдлийг хэрэглэгчийн бүртгэлээр харна. Ажлын үйлдлээ самбараас хийнэ үү." : "You are signed in with a work account. Personal bookings and private feedback use a customer account. Continue in your workspace for staff or CEO tools."}</p>
            <Link href="/admin" className="mt-5 inline-flex rounded-lg bg-teal px-5 py-3 font-medium text-white">{lang === "mn" ? "Ажлын самбар нээх" : "Open workspace"}</Link>
          </section>
        ) : <>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{labels.bookings[lang]}</h2>

          {loadingBookings ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bookingsError ? (
            <div className="text-center">
              <p role="alert" className="text-red-700 bg-red-50 rounded-lg p-4">{bookingsError}</p>
              <button
                type="button"
                onClick={() => user && void loadCustomerData()}
                className="mt-4 rounded-lg bg-teal px-4 py-2 font-medium text-white hover:bg-teal-dark"
              >
                {labels.retry[lang]}
              </button>
              <p className="mt-4 text-sm text-slate-500">{labels.support[lang]}</p>
              <a className="mt-1 inline-block font-semibold text-teal underline" href={`tel:${PHONE1.replaceAll("-", "")}`}>
                {PHONE1}
              </a>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              <p>{labels.noBookings[lang]}</p>
              <p className="mt-2 text-sm">
                {lang === "mn"
                  ? "Өмнөх захиалгыг и-мэйлээр автоматаар холбодоггүй. Ажилтан таны бүртгэлийг баталгаажуулсны дараа холбож өгнө."
                  : "Older bookings are not linked by email automatically. Ask staff to verify and link your account if needed."}
              </p>
              <p className="mt-4 text-sm">{labels.support[lang]}</p>
              <a className="mt-2 inline-block font-semibold text-teal underline" href={`tel:${PHONE1.replaceAll("-", "")}`}>
                {PHONE1}
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border border-slate-200 rounded-lg p-4 hover:border-teal transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-mono text-teal font-bold">{booking.ref}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor(booking.status)}`}>
                          {statusLabel(booking.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{lang === "mn" ? "Өрөө" : "Room"}</p>
                          <p className="font-semibold text-slate-900">{getRoomName(booking.room_id)}</p>
                          <p className="mt-1 text-xs text-slate-600">{lang === "mn" ? "Ор" : "Beds"}: {booking.beds.join(", ") || (lang === "mn" ? "Хүлээн авалтаас лавлана уу" : "Ask reception")}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{lang === "mn" ? "Огноо" : "Dates"}</p>
                          <p className="font-semibold text-slate-900">
                            {new Date(`${booking.check_in}T00:00:00`).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US")} -{" "}
                            {new Date(`${booking.check_out}T00:00:00`).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US")}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{lang === "mn" ? "Зочид" : "Guests"}</p>
                          <p className="font-semibold text-slate-900">{booking.guests}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{lang === "mn" ? "Дүн" : "Total"}</p>
                          <p className="font-bold text-teal">{formatMNT(booking.total)}</p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {lang === "mn" ? "Тохирсон үнэ; төлсөн дүн биш" : "Agreed price; not amount paid"}
                          </p>
                        </div>
                        <div className="col-span-full mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                          {[
                            [lang === "mn" ? "Баталгаажсан хүлээн авалт" : "Verified receipts", booking.financials.completedPayments],
                            [lang === "mn" ? "Буцаасан дүн" : "Completed refunds", booking.financials.completedRefunds],
                            [lang === "mn" ? "Цэвэр хүлээн авсан" : "Net received", booking.financials.netReceived],
                            [lang === "mn" ? "Хүлээгдэж буй шилжүүлэг" : "Pending transfers", booking.financials.pendingPayments],
                          ].map(([label, value]) => <p key={label} className="text-sm"><span className="block text-slate-500">{label}</span><strong>{formatMntAmount(value)}</strong></p>)}
                          <p className="text-sm"><span className="block text-slate-500">{lang === "mn" ? "Үлдэгдэл" : "Remaining balance"}</span><strong>{booking.financials.remainingBalance === null ? (lang === "mn" ? "Хүлээн авалтаар тодруулна" : "Confirm with reception") : formatMntAmount(booking.financials.remainingBalance)}</strong></p>
                          {!booking.financials.completeHistory && <p className="text-sm text-amber-800">{lang === "mn" ? "Өмнөх төлбөрийн түүх бүрэн баталгаажаагүй." : "Historical payment coverage is incomplete."}</p>}
                          {booking.status === "pending" && booking.expires_at && <p className="text-sm text-amber-800 sm:col-span-2">{lang === "mn" ? "Ажилтны баталгаажуулалт хүлээгдэж байна. Түр хадгалалтын хугацаа" : "Awaiting staff confirmation. Pending hold expires"} · {new Date(booking.expires_at).toLocaleString(lang === "mn" ? "mn-MN" : "en-US", { timeZone: "Asia/Ulaanbaatar" })}</p>}
                        </div>
                        {booking.status === "checked_out"
                          && !loadingFeedback
                          && !feedbackError
                          && !feedback.some(item => item.booking_id === booking.id) && (
                          <div className="col-span-full mt-4">
                            {reviewingBookingId === booking.id ? (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                  {renderRatingInput(labels.roomRating[lang], roomRating, setRoomRating)}
                                  {renderRatingInput(labels.serviceRating[lang], serviceRating, setServiceRating)}
                                </div>
                                <label className="mt-4 block text-sm font-medium text-slate-700">
                                  {labels.comment[lang]}
                                  <textarea
                                    value={feedbackComment}
                                    disabled={savingFeedback}
                                    maxLength={2000}
                                    onChange={event => setFeedbackComment(event.target.value)}
                                    rows={3}
                                    className="mt-2 w-full rounded-lg border border-slate-200 p-3"
                                  />
                                </label>
                                {feedbackSubmitError && <p role="alert" className="mt-3 text-sm text-red-700">{feedbackSubmitError}</p>}
                                <div className="mt-4 flex flex-wrap gap-3">
                                  <button
                                    type="button"
                                    disabled={savingFeedback}
                                    onClick={() => void submitFeedback(booking.id)}
                                    className="rounded-lg bg-teal px-4 py-2 font-medium text-white hover:bg-teal-dark disabled:opacity-50"
                                  >
                                    {savingFeedback ? "…" : labels.submitFeedback[lang]}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingFeedback}
                                    onClick={() => setReviewingBookingId(null)}
                                    className="rounded-lg bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-300 disabled:opacity-50"
                                  >
                                    {labels.cancel[lang]}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openFeedbackForm(booking.id)}
                                className="rounded-lg border border-teal px-4 py-2 font-semibold text-teal hover:bg-teal/5"
                              >
                                {labels.rateStay[lang]}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <section className="mt-8"><BookingPaymentInstructions /></section>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm" aria-labelledby="my-feedback-heading">
          <h2 id="my-feedback-heading" className="mb-6 text-2xl font-bold text-slate-900">{labels.myFeedback[lang]}</h2>
          {feedbackNotice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-4 text-emerald-800">{feedbackNotice}</p>}
          {loadingFeedback ? (
            <div className="flex justify-center py-10" aria-label={lang === "mn" ? "Ачаалж байна" : "Loading"}>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
            </div>
          ) : feedbackError ? (
            <div className="text-center">
              <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{feedbackError}</p>
              <button
                type="button"
                onClick={() => user && void loadCustomerData()}
                className="mt-4 rounded-lg bg-teal px-4 py-2 font-medium text-white hover:bg-teal-dark"
              >
                {labels.retry[lang]}
              </button>
            </div>
          ) : feedback.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              {lang === "mn" ? "Одоогоор илгээсэн сэтгэгдэл алга." : "You have not submitted any feedback yet."}
            </p>
          ) : (
            <div className="space-y-4">
              {feedback.map(item => (
                <article key={item.id} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {item.room_id ? getRoomName(item.room_id) : labels.unknownRoom[lang]}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Date(`${item.check_in}T00:00:00`).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US")}{" - "}
                        {new Date(`${item.check_out}T00:00:00`).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US")}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {labels.submitted[lang]}: {new Date(item.submitted_at).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US")}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <p>{labels.roomRating[lang]}: <strong>{item.room_rating}/5</strong></p>
                    <p>{labels.serviceRating[lang]}: <strong>{item.service_rating}/5</strong></p>
                  </div>
                  {item.comment && <p className="mt-3 whitespace-pre-wrap break-words text-slate-700">{item.comment}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
        </>}
      </div>
    </div>
  );
}
