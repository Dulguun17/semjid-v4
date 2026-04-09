"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { rooms } from "@/lib/data";
import { Save, Upload, Loader2, Image as ImageIcon, Plus, Minus, Edit3, X } from "lucide-react";

type RoomPrice = {
  id: string;
  adult1: number | null;
  adult2: number | null;
  child02: number | null;
  img: string;
};

export default function RoomsManagement() {
  const [roomPrices, setRoomPrices] = useState<Record<string, RoomPrice>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [priceEdits, setPriceEdits] = useState<Record<string, Partial<RoomPrice>>>({});

  // Load room prices from Supabase
  const loadRoomPrices = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("rooms").select("id, adult1, adult2, child02, img");

      if (error) {
        console.warn("Rooms table not found or error:", error.message);
        // Initialize with static data if table doesn't exist
        const initialized: Record<string, RoomPrice> = {};
        rooms.forEach(room => {
          initialized[room.id] = {
            id: room.id,
            adult1: room.adult1,
            adult2: room.adult2,
            child02: room.child02,
            img: room.img,
          };
        });
        setRoomPrices(initialized);
        return;
      }

      // Merge Supabase data with static data
      const merged: Record<string, RoomPrice> = {};
      rooms.forEach(room => {
        const live = data?.find(r => r.id === room.id);
        merged[room.id] = {
          id: room.id,
          adult1: live?.adult1 ?? room.adult1,
          adult2: live?.adult2 ?? room.adult2,
          child02: live?.child02 ?? room.child02,
          img: live?.img && live.img.trim() !== "" ? live.img : room.img,
        };
      });
      setRoomPrices(merged);
    } catch (err) {
      console.error("Failed to load room prices:", err);
      setMessage({ type: "error", text: "Өрөөний үнийг ачаалах бүтэлгүүтэй болсон" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoomPrices();
  }, [loadRoomPrices]);

  // Save room prices
  const saveRoom = async (roomId: string) => {
    setSaving(roomId);
    setMessage(null);

    try {
      const room = priceEdits[roomId] || roomPrices[roomId];
      const { error } = await supabase.from("rooms").upsert({
        id: roomId,
        adult1: room.adult1,
        adult2: room.adult2,
        child02: room.child02,
        img: room.img,
      });

      if (error) throw error;

      // Update local state
      setRoomPrices(prev => ({
        ...prev,
        [roomId]: room as RoomPrice,
      }));

      setPriceEdits(prev => {
        const copy = { ...prev };
        delete copy[roomId];
        return copy;
      });

      setEditingRoom(null);
      setMessage({ type: "success", text: `${rooms.find(r => r.id === roomId)?.name.mn} амжилттай шинэчлэгдлээ` });
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: "error", text: "Хадгалах бүтэлгүүтэй болсон" });
    } finally {
      setSaving(null);
    }
  };

  // Upload image
  const uploadImage = async (roomId: string, file: File) => {
    setUploading(roomId);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setPriceEdits(prev => ({
        ...prev,
        [roomId]: {
          ...(prev[roomId] || roomPrices[roomId]),
          img: data.url,
        },
      }));

      setMessage({ type: "success", text: "Зураг оруулагдлаа" });
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({ type: "error", text: "Зураг оруулах бүтэлгүүтэй болсон" });
    } finally {
      setUploading(null);
    }
  };

  const updatePrice = (roomId: string, key: "adult1" | "adult2" | "child02", value: number | null) => {
    setPriceEdits(prev => ({
      ...prev,
      [roomId]: {
        ...(prev[roomId] || roomPrices[roomId]),
        [key]: value,
      },
    }));
  };

  const getRoomData = (roomId: string) => {
    return priceEdits[roomId] || roomPrices[roomId];
  };

  const hasChanges = (roomId: string) => {
    return priceEdits[roomId] !== undefined;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Өрөө удирдалга</h1>
        <p className="text-sm text-slate-500 mt-1">Өрөөний үнэ болон зургийг удирдах</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
          message.type === "success"
            ? "bg-teal/10 text-teal border border-teal/30"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {message.type === "success" ? "✓" : "✕"}
          {message.text}
        </div>
      )}

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rooms.map(room => {
          const data = getRoomData(room.id);
          const isEditing = editingRoom === room.id;
          const hasEdits = hasChanges(room.id);
          const isSaving = saving === room.id;
          const isUploading = uploading === room.id;

          return (
            <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Header */}
              <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                {data?.img ? (
                  <img src={data.img} alt={room.name.mn} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <ImageIcon size={40} className="text-slate-300" />
                  </div>
                )}
                <button
                  onClick={() => setEditingRoom(isEditing ? null : room.id)}
                  className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-lg transition-colors text-slate-600"
                >
                  <Edit3 size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-800">{room.name.mn}</h3>
                  <p className="text-[13px] text-slate-500">{room.type.mn}</p>
                </div>

                {isEditing ? (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    {/* Image Upload */}
                    <div className="space-y-2">
                      <label className="text-[12px] font-medium text-slate-600 uppercase">Зураг</label>
                      <label className={`flex items-center justify-center gap-2 text-sm cursor-pointer px-4 py-3 rounded-lg border transition-colors ${
                        isUploading
                          ? "border-slate-200 bg-slate-50 text-slate-400"
                          : "border-teal/30 hover:border-teal/50 hover:bg-teal/5 text-teal"
                      }`}>
                        {isUploading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Байршуулж байна...
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            Зураг солих
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) uploadImage(room.id, file);
                          }}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Prices */}
                    {[
                      { key: "adult2", label: "Насанд хүрэгчийн үнэ (2)" },
                      { key: "adult1", label: "Насанд хүрэгчийн үнэ (1)" },
                      { key: "child02", label: "Хүүхдийн үнэ (0-2)" },
                    ].map(({ key, label }) => {
                      const typed_key = key as "adult1" | "adult2" | "child02";
                      return (
                        <div key={key} className="space-y-1.5">
                          <label className="text-[12px] font-medium text-slate-600 uppercase">{label}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={data?.[typed_key] ?? ""}
                              onChange={e => updatePrice(room.id, typed_key, e.target.value ? parseInt(e.target.value) : null)}
                              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal"
                              placeholder="Үнэ оруулах"
                            />
                            <span className="text-[12px] text-slate-500">₮</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    {[
                      { key: "adult2", label: "Насанд хүрэгчийн үнэ (2)", short: "2-р насанд" },
                      { key: "adult1", label: "Насанд хүрэгчийн үнэ (1)", short: "1-р насанд" },
                      { key: "child02", label: "Хүүхдийн үнэ (0-2)", short: "0-2 нас" },
                    ].map(({ key, short }) => {
                      const typed_key = key as "adult1" | "adult2" | "child02";
                      return (
                        <div key={key} className="flex justify-between items-center text-[13px]">
                          <span className="text-slate-600">{short}</span>
                          <span className="font-medium text-slate-800">
                            {data?.[typed_key] ? `${data[typed_key]?.toLocaleString("mn-MN")}₮` : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                {isEditing && (
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => saveRoom(room.id)}
                      disabled={isSaving || !hasEdits}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSaving || !hasEdits
                          ? "bg-slate-100 text-slate-400"
                          : "bg-teal text-white hover:bg-teal-dark"
                      }`}
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Хадгалах
                    </button>
                    <button
                      onClick={() => {
                        setEditingRoom(null);
                        setPriceEdits(prev => {
                          const copy = { ...prev };
                          delete copy[room.id];
                          return copy;
                        });
                      }}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Цуцлах
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-slate-50 border border-slate-300 rounded-xl p-4">
        <p className="text-sm text-slate-600">
          <span className="font-medium">💡 Зөвлөмж:</span> Энд өрөөний үнэ болон зургийг хянах боломжтой. 
          Өөрчлөлт нь вебсайтын /rooms хуудсанд нэрэн харагдана.
        </p>
      </div>
    </div>
  );
}
