"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { formatMNT } from "@/lib/data";
import { TrendingUp, TrendingDown, Users, Wallet, Calendar, CheckCircle, Clock, XCircle, BarChart3 } from "lucide-react";

type Booking = {
  id: string; ref: string; fname: string; lname: string;
  check_in: string; check_out: string; room_id: string;
  guests: number; total: number; status: string; created_at: string;
};

export default function AnalyticsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    setDateRange({
      start: thirtyDaysAgo.toISOString().split("T")[0],
      end: today.toISOString().split("T")[0],
    });
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      setBookings(data || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Calculate metrics
  const stats = {
    totalBookings: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    totalGuests: bookings.reduce((sum, b) => sum + b.guests, 0),
    totalRevenue: bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + b.total, 0),
  };

  // Revenue by month
  const revenueByMonth = bookings
    .filter((b) => b.status === "confirmed")
    .reduce(
      (acc, b) => {
        const month = new Date(b.check_in).toLocaleString("mn-MN", {
          month: "short",
        });
        acc[month] = (acc[month] || 0) + b.total;
        return acc;
      },
      {} as Record<string, number>
    );

  // Room popularity
  const roomPopularity = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce(
      (acc, b) => {
        acc[b.room_id] = (acc[b.room_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

  // Booking status trend
  const bookingByStatus = {
    confirmed: stats.confirmed,
    pending: stats.pending,
    cancelled: stats.cancelled,
  };

  const maxRevenue = Math.max(...Object.values(revenueByMonth), 1);
  const maxRoomBookings = Math.max(...Object.values(roomPopularity), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Аналитик</h1>
        <p className="text-sm text-slate-500 mt-1">
          Захиалга, орооны ашиглалт, орлогын мэдээлэл
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Нийт захиалга</p>
              <p className="text-3xl font-bold mt-2">{stats.totalBookings}</p>
            </div>
            <Calendar className="text-teal opacity-20" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Баталгаажсан</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">
                {stats.confirmed}
              </p>
            </div>
            <CheckCircle className="text-emerald-500 opacity-20" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Нийт зочид</p>
              <p className="text-3xl font-bold mt-2">{stats.totalGuests}</p>
            </div>
            <Users className="text-blue-500 opacity-20" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Нийт орлого</p>
              <p className="text-2xl font-bold text-teal mt-2">
                {formatMNT(stats.totalRevenue)}
              </p>
            </div>
            <Wallet className="text-teal opacity-20" size={40} />
          </div>
        </div>
      </div>

      {/* Revenue & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Сарын орлога
          </h2>
          <div className="space-y-3">
            {Object.entries(revenueByMonth)
              .sort()
              .map(([month, revenue]) => (
                <div key={month}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-600 font-medium">
                      {month}
                    </span>
                    <span className="text-sm font-bold text-teal">
                      {formatMNT(revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal h-full rounded-full transition-all"
                      style={{
                        width: `${(revenue / maxRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Захиалгын статус
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <span className="text-sm text-slate-700 font-medium">
                    Баталгаажсан
                  </span>
                </div>
                <span className="text-lg font-bold text-emerald-600">
                  {bookingByStatus.confirmed}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${(bookingByStatus.confirmed / stats.totalBookings) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-amber-500" />
                  <span className="text-sm text-slate-700 font-medium">
                    Хүлээлтэнд
                  </span>
                </div>
                <span className="text-lg font-bold text-amber-600">
                  {bookingByStatus.pending}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${(bookingByStatus.pending / stats.totalBookings) * 100 || 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <XCircle size={18} className="text-red-500" />
                  <span className="text-sm text-slate-700 font-medium">
                    Цуцлагдсан
                  </span>
                </div>
                <span className="text-lg font-bold text-red-600">
                  {bookingByStatus.cancelled}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-red-500 h-full rounded-full"
                  style={{
                    width: `${(bookingByStatus.cancelled / stats.totalBookings) * 100 || 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Popularity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Өрөөнүүдийн ашиглалт
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(roomPopularity)
            .sort((a, b) => b[1] - a[1])
            .map(([room, count]) => (
              <div key={room} className="text-center">
                <div className="bg-gradient-to-br from-teal to-teal-dark rounded-lg p-4 mb-3">
                  <BarChart3 size={24} className="text-white mx-auto" />
                </div>
                <p className="font-semibold text-slate-900">{room}</p>
                <p className="text-2xl font-bold text-teal">{count}</p>
                <p className="text-xs text-slate-500 mt-1">захиалга</p>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Сүүлийн захиалгууд
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner text-teal" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-center text-slate-400 py-8">Захиалга байхгүй</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr className="text-slate-600 uppercase text-xs tracking-wider">
                  <th className="text-left py-3 px-4">Дугаар</th>
                  <th className="text-left py-3 px-4">Нэр</th>
                  <th className="text-left py-3 px-4">Өрөө</th>
                  <th className="text-left py-3 px-4">Огноо</th>
                  <th className="text-left py-3 px-4">Дүн</th>
                  <th className="text-left py-3 px-4">Статус</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 10).map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 font-mono text-teal">
                      {booking.ref}
                    </td>
                    <td className="py-3 px-4">
                      {booking.fname} {booking.lname}
                    </td>
                    <td className="py-3 px-4">{booking.room_id}</td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(booking.check_in).toLocaleDateString("mn-MN")} →{" "}
                      {new Date(booking.check_out).toLocaleDateString("mn-MN")}
                    </td>
                    <td className="py-3 px-4 font-bold text-teal">
                      {formatMNT(booking.total)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-700"
                            : booking.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {booking.status === "confirmed"
                          ? "Баталгаажсан"
                          : booking.status === "pending"
                            ? "Хүлээлтэнд"
                            : "Цуцлагдсан"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}