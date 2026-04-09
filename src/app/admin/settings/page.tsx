"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, Loader2, Check, X, FileText, Download } from "lucide-react";

type Settings = {
  id: string;
  referral_letter_url: string | null;
  updated_at: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", "main")
        .single();

      if (error || !data) {
        // Row doesn't exist, try to create it
        const { data: newSettings, error: insertError } = await supabase
          .from("settings")
          .upsert({ id: "main", referral_letter_url: null, updated_at: new Date().toISOString() }, { onConflict: "id" })
          .select()
          .single();
        setSettings(newSettings || { id: "main", referral_letter_url: null, updated_at: new Date().toISOString() });
      } else if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      setMessage({ type: "error", text: "Тохиргоо ачаалах бүтэлгүүтэй болсон" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "Файл нь 10MB-ээс хэтрэхгүй байх ёстой" });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Save to settings (upsert - insert if doesn't exist, update if does)
      const { error: updateError } = await supabase
        .from("settings")
        .upsert({
          id: "main",
          referral_letter_url: data.url,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (updateError) throw updateError;

      setSettings(prev => prev ? {
        ...prev,
        referral_letter_url: data.url,
        updated_at: new Date().toISOString(),
      } : null);

      setMessage({ type: "success", text: "Илгээх бичиг амжилттай байршуулагдлаа ✓" });
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Upload бүтэлгүүтэй болсон" });
    } finally {
      setUploading(false);
    }
  };

  // Handle file removal
  const handleRemoveFile = async () => {
    try {
      setUploading(true);
      const { error } = await supabase
        .from("settings")
        .upsert({
          id: "main",
          referral_letter_url: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (error) throw error;

      setSettings(prev => prev ? {
        ...prev,
        referral_letter_url: null,
        updated_at: new Date().toISOString(),
      } : null);

      setMessage({ type: "success", text: "Файл устгагдлаа" });
    } catch (err) {
      console.error("Remove error:", err);
      setMessage({ type: "error", text: "Файл устгах бүтэлгүүтэй болсон" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Тохиргоо</h1>
        <p className="text-sm text-slate-500 mt-1">Вебсайтын глобал тохиргоо удирдалга</p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
          message.type === 'success' 
            ? 'bg-teal/10 text-teal border border-teal/30' 
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {message.text}
        </div>
      )}

      {/* Referral Letter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileText size={18} className="text-teal" />
            Илгээх бичиг (Referral Letter)
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">
            Илгээх бичиг эсвэл аливаа файл байршуулах. Зочид сайтаас татаж авч болно.
          </p>
        </div>

        <div className="px-6 py-6 space-y-4">
          {/* Current File Display */}
          {settings?.referral_letter_url ? (
            <div className="flex items-center justify-between p-4 bg-teal/5 border border-teal/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-teal" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">Илгээх бичиг</p>
                  <p className="text-[12px] text-slate-500">
                    Сүүлчийн өөрчлөлт: {new Date(settings.updated_at).toLocaleDateString("mn-MN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={settings.referral_letter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-teal/10 rounded-lg transition-colors text-teal"
                  title="Файл татаж авах"
                >
                  <Download size={18} />
                </a>
                <button
                  onClick={handleRemoveFile}
                  disabled={uploading}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500 disabled:opacity-50"
                  title="Файл устгах"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-slate-500 italic">Файл байршуулагдаагүй байна</p>
          )}

          {/* Upload Area */}
          <label className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
            uploading
              ? "border-slate-200 bg-slate-50 text-slate-400"
              : "border-teal/30 hover:border-teal/50 hover:bg-teal/5 text-slate-600"
          }`}>
            {uploading ? (
              <>
                <Loader2 size={24} className="animate-spin text-teal" />
                <span className="text-sm font-medium">Байршуулж байна...</span>
              </>
            ) : (
              <>
                <Upload size={24} className="text-teal" />
                <div className="text-center">
                  <span className="text-sm font-medium text-teal">Файл сонгох</span>
                  <p className="text-[12px] text-slate-500 mt-0.5">эсвэл энд чирж оруулах (макс 10MB)</p>
                </div>
              </>
            )}
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <p className="text-[12px] text-slate-500">
            💡 Файл сайтын /booking хуудсанд зочдуудыг түрүүлэх зүйлсийн хэсэгт гарч ирнэ.
          </p>
        </div>
      </div>

      {/* Additional Settings Sections */}
      <div className="bg-slate-50 border border-slate-300 rounded-xl p-4">
        <p className="text-sm text-slate-600">
          <span className="font-medium">📝 Зөвлөмж:</span> Контентын ихэнх хэсэг (/admin/content) хаягаар удирдаж болно. 
          Энэ хэсэг нь глобал тохиргоонд (файлын захидал, нийтлэг тохиргоо) зориулагдсан.
        </p>
      </div>
    </div>
  );
}
