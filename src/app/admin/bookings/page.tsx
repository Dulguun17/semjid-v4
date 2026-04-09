"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Check,
  X,
  MessageCircle,
  Star,
  Filter,
  Loader2,
  Trash2,
  Reply,
} from "lucide-react";

type Review = {
  id: string;
  room_id: string;
  fname: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
};

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [responding, setResponding] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      setReviews(data || []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
    const interval = setInterval(loadReviews, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadReviews]);

  const approveReview = async (id: string) => {
    try {
      await supabase.from("reviews").update({ approved: true }).eq("id", id);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)));
    } catch (err) {
      console.error("Failed to approve review:", err);
    }
  };

  const rejectReview = async (id: string) => {
    try {
      await supabase.from("reviews").delete().eq("id", id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to reject review:", err);
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.approved;
    if (filter === "approved") return r.approved;
    return true;
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => !r.approved).length,
    approved: reviews.filter((r) => r.approved).length,
    avgRating:
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Санал хүлээлт</h1>
        <p className="text-sm text-slate-500 mt-1">
          Зочдоос хүлээлтийн мэдээлэл удирдах, батлах эсвэл цуцлах
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Нийт</p>
          <p className="text-3xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Хүлээлтэнд</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Баталгаажсан</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Дундаж үнэлгээ</p>
          <p className="text-3xl font-bold text-teal mt-2">{stats.avgRating}★</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-slate-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="all">Бүх санал</option>
            <option value="pending">Хүлээлтэнд (батлагдаагүй)</option>
            <option value="approved">Баталгаажсан</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-teal" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <MessageCircle className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-500">Санал байхгүй</p>
          </div>
        ) : (
          filtered.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{review.fname}</h3>
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                      ))}
                      {[...Array(5 - review.rating)].map((_, i) => (
                        <Star key={i} size={16} className="text-slate-300" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{review.comment}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>📍 {review.room_id}</span>
                    <span>📅 {new Date(review.created_at).toLocaleDateString("mn-MN")}</span>
                    {review.approved && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        ✓ Баталгаажсан
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {responding === review.id ? (
                <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={3}
                    placeholder="Эмчилгээлээ хариу бичнэ үү..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent resize-none"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setResponding(null)}
                      className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                    >
                      Цуцлах
                    </button>
                  </div>
                </div>
              ) : null}

              {!review.approved && (
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => approveReview(review.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition font-medium"
                  >
                    <Check size={18} /> Баталгаажуулах
                  </button>
                  <button
                    onClick={() => rejectReview(review.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition font-medium"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
