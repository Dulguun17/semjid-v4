"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Нэвтрэх нэр эсвэл нууц үг буруу байна.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <h1 className="font-serif text-2xl text-slate-800">Admin Panel</h1>
          <p className="text-[13px] text-slate-400 mt-1">Сэмжид Хүжирт Рашаан Сувилал</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5">И-мэйл</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-teal focus:bg-white outline-none px-4 py-2.5 text-[14px] text-slate-700 rounded-lg transition-colors"
              placeholder="admin@semjid.mn"
            />
          </div>
          <div className="mb-6">
            <label className="text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5">Нууц үг</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-teal focus:bg-white outline-none px-4 py-2.5 text-[14px] text-slate-700 rounded-lg transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal hover:bg-teal-dark text-white py-3 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Нэвтрэж байна..." : "Нэвтрэх"}
          </button>
        </form>
      </div>
    </div>
  );
}
