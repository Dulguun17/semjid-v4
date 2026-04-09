"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle,
  Clock,
  XCircle,
  Edit2,
  Trash2,
  Plus,
  Search,
  Filter,
  Save,
  X,
} from "lucide-react";
import { formatMNT } from "@/lib/data";

type Booking = {
  id: string;
  ref: string;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  total: number;
  payment: string;
  created_at: string;
};

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Booking>>({});

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

  const updateBooking = async (id: string) => {
    try {
      await supabase
        .from("bookings")
        .update(formData)
        .eq("id", id);
      setEditing(null);
      loadBookings();
    } catch (err) {
      console.error("Failed to update booking:", err);
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Энэ захиалгыг цуцлахдаа чадах уу?")) return;
    try {
      await supabase.from("bookings").delete().eq("id", id);
      loadBookings();
    } catch (err) {
      console.error("Failed to delete booking:", err);
    }
  };

  const filtered = bookings
    .filter((b) => filter === "all" || b.status === filter)
    .filter(
      (b) =>
        !search ||
        b.fname.toLowerCase().includes(search.toLowerCase()) ||
        b.lname.toLowerCase().includes(search.toLowerCase()) ||
        b.ref.includes(search) ||
        b.email.includes(search)
    );

  const statusColor = (status: string) => {
    if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
    if (status === "cancelled") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Хүлээлтэнд",
      confirmed: "Баталгаажсан",
      cancelled: "Цуцлагдсан",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Захиалгууд</h1>
        <p className="text-sm text-slate-500 mt-1">
          Бүх захиалгыг удирдах, засах, цуцлах
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Нэр, имэйл, дугаараар хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
        >
          <option value="all">Бүх статус</option>
          <option value="pending">Хүлээлтэнд</option>
          <option value="confirmed">Баталгаажсан</option>
          <option value="cancelled">Цуцлагдсан</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            Захиалга олдсонгүй
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-slate-600 uppercase text-xs tracking-wider">
                  <th className="text-left py-4 px-4">Дугаар</th>
                  <th className="text-left py-4 px-4">Нэр</th>
                  <th className="text-left py-4 px-4">Өрөө</th>
                  <th className="text-left py-4 px-4">Огноо</th>
                  <th className="text-left py-4 px-4">Дүн</th>
                  <th className="text-left py-4 px-4">Статус</th>
                  <th className="text-left py-4 px-4">Үйл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-mono text-teal font-bold">
                      {booking.ref}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold">{booking.fname} {booking.lname}</p>
                        <p className="text-xs text-slate-500">{booking.phone}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">{booking.room_id}</td>
                    <td className="py-4 px-4 text-xs">
                      {new Date(booking.check_in).toLocaleDateString("mn-MN")} →{" "}
                      {new Date(booking.check_out).toLocaleDateString("mn-MN")}
                    </td>
                    <td className="py-4 px-4 font-bold text-teal">
                      {formatMNT(booking.total)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(booking.status)}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 flex gap-2">
                      {editing === booking.id ? (
                        <>
                          <button
                            onClick={() => updateBooking(booking.id)}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition"
                            title="Хадгалах"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="p-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                            title="Цуцлах"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditing(booking.id);
                              setFormData(booking);
                            }}
                            className="p-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                            title="Засах"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteBooking(booking.id)}
                            className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                            title="Цуцлах"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && formData.id && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Захиалга засах</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Нэр"
                  value={formData.fname || ""}
                  onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal"
                />
                <input
                  type="text"
                  placeholder="Овог"
                  value={formData.lname || ""}
                  onChange={(e) => setFormData({ ...formData, lname: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal"
                />
              </div>
              <select
                value={formData.status || "pending"}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal"
              >
                <option value="pending">Хүлээлтэнд</option>
                <option value="confirmed">Баталгаажсан</option>
                <option value="cancelled">Цуцлагдсан</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => updateBooking(formData.id!)}
                  className="flex-1 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition"
                >
                  Хадгалах
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  Цуцлах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
