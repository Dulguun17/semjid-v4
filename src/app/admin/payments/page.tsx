"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { formatMNT } from "@/lib/data";
import {
  CreditCard,
  Download,
  Filter,
  TrendingUp,
  Calendar,
  DollarSign,
} from "lucide-react";

type Booking = {
  id: string;
  ref: string;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  check_in: string;
  check_out: string;
  room_id: string;
  total: number;
  payment: string;
  status: string;
  created_at: string;
};

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "cash" | "bank" | "qpay">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");

  const load = useCallback(async () => {
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
    load();
  }, [load]);

  // Filter bookings
  const filtered = bookings
    .filter((b) => filter === "all" || b.payment === filter)
    .filter((b) => statusFilter === "all" || b.status === statusFilter);

  // Calculate statistics
  const stats = {
    totalAmount: filtered.reduce((sum, b) => sum + (b.total || 0), 0),
    confirmedAmount: filtered
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + b.total, 0),
    pendingAmount: filtered
      .filter((b) => b.status === "pending")
      .reduce((sum, b) => sum + b.total, 0),
    cashAmount: filtered
      .filter((b) => b.payment === "cash")
      .reduce((sum, b) => sum + b.total, 0),
    bankAmount: filtered
      .filter((b) => b.payment === "bank")
      .reduce((sum, b) => sum + b.total, 0),
    qpayAmount: filtered
      .filter((b) => b.payment === "qpay")
      .reduce((sum, b) => sum + b.total, 0),
    count: filtered.length,
  };

  // Payment method breakdown
  const paymentMethods = [
    {
      name: "Бэлэн төлбөр",
      value: stats.cashAmount,
      count: filtered.filter((b) => b.payment === "cash").length,
      color: "bg-emerald-100 text-emerald-700",
      icon: "💰",
    },
    {
      name: "Банк шилжүүлэх",
      value: stats.bankAmount,
      count: filtered.filter((b) => b.payment === "bank").length,
      color: "bg-blue-100 text-blue-700",
      icon: "🏦",
    },
    {
      name: "QPay",
      value: stats.qpayAmount,
      count: filtered.filter((b) => b.payment === "qpay").length,
      color: "bg-purple-100 text-purple-700",
      icon: "📱",
    },
  ];

  // Export to CSV
  const exportCSV = () => {
    const rows = [
      [
        "Дугаар",
        "Нэр",
        "Овог",
        "Утас",
        "И-мэйл",
        "Өрөө",
        "Ирэх",
        "Явах",
        "Нийт дүн",
        "Төлбөрийн хэлбэр",
        "Статус",
        "Төлбөрлөгджөөх өдөр",
      ],
      ...filtered.map((b) => [
        b.ref,
        b.fname,
        b.lname,
        b.phone,
        b.email || "",
        b.room_id,
        b.check_in,
        b.check_out,
        b.total,
        b.payment,
        b.status,
        new Date(b.created_at).toLocaleDateString("mn-MN"),
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Төлбөрийн мэдээлэл</h1>
        <p className="text-sm text-slate-500 mt-1">
          Төлбөр, орлого, төлбөрийн хэлбэр бүрэн мэдээлэл
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-teal to-teal-dark rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm">Нийт дүн</p>
              <p className="text-2xl font-bold mt-2">{formatMNT(stats.totalAmount)}</p>
            </div>
            <DollarSign size={40} className="opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Баталгаажсан</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {formatMNT(stats.confirmedAmount)}
              </p>
            </div>
            <TrendingUp className="text-emerald-500 opacity-20" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div>
            <p className="text-sm text-slate-500">Хүлээлтэнд</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">
              {formatMNT(stats.pendingAmount)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div>
            <p className="text-sm text-slate-500">Нийт захиалга</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {stats.count}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paymentMethods.map((method) => (
          <div key={method.name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xl">{method.icon}</p>
              </div>
              <span className={`text-2xl font-bold`}>{method.icon}</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">{method.name}</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {formatMNT(method.value)}
            </p>
            <p className="text-xs text-slate-400 mt-2">{method.count} захиалга</p>
          </div>
        ))}
      </div>

      {/* Filters & Export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Filter size={18} className="text-slate-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="all">Бүх төлбөрийн хэлбэр</option>
            <option value="cash">Бэлэн төлбөр</option>
            <option value="bank">Банк</option>
            <option value="qpay">QPay</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="all">Бүх статус</option>
            <option value="confirmed">Баталгаажсан</option>
            <option value="pending">Хүлээлтэнд</option>
            <option value="cancelled">Цуцлагдсан</option>
          </select>

          <button
            onClick={exportCSV}
            className="ml-auto px-4 py-2 bg-teal text-white rounded-lg text-sm hover:bg-teal-dark flex items-center gap-2 transition"
          >
            <Download size={16} /> CSV татаж авах
          </button>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Төлбөрийн түүх
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Төлбөрийн мэдээлэл байхгүй</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr className="text-slate-600 uppercase text-xs tracking-wider">
                  <th className="text-left py-3 px-4">Дугаар</th>
                  <th className="text-left py-3 px-4">Нэр</th>
                  <th className="text-left py-3 px-4">Дүн</th>
                  <th className="text-left py-3 px-4">Төлбөрийн хэлбэр</th>
                  <th className="text-left py-3 px-4">Статус</th>
                  <th className="text-left py-3 px-4">Огноо</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 font-mono text-teal font-semibold">
                      {booking.ref}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {booking.fname} {booking.lname}
                        </p>
                        <p className="text-xs text-slate-500">{booking.phone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-teal">
                      {formatMNT(booking.total)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.payment === "cash"
                            ? "bg-emerald-100 text-emerald-700"
                            : booking.payment === "bank"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {booking.payment === "cash"
                          ? "💰 Бэлэн"
                          : booking.payment === "bank"
                            ? "🏦 Банк"
                            : "📱 QPay"}
                      </span>
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
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(booking.created_at).toLocaleDateString("mn-MN")}
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
