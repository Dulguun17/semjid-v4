"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/lang-context";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { lang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(lang === "mn" ? "И-мэйл эсвэл нууц үг буруу байна." : "Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] text-slate-400 hover:text-slate-600 mb-8 transition-colors">
          <ArrowLeft size={14} />
          {lang === "mn" ? "Буцах" : "Back"}
        </Link>

        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <h1 className="font-serif text-2xl text-slate-800">
            {lang === "mn" ? "Нэвтрэх" : "Sign In"}
          </h1>
          <p className="text-[13px] text-slate-400 mt-1">
            {lang === "mn" ? "Сэмжид Хүжирт Рашаан Сувилал" : "Semjid Khujirt Resort"}
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5">
              {lang === "mn" ? "И-МЭЙЛ" : "EMAIL"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-teal transition-colors"
              placeholder={lang === "mn" ? "И-мэйл хаяг" : "Email address"}
              required
            />
          </div>

          <div className="mb-6">
            <label className="text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5">
              {lang === "mn" ? "НУУЦ ҮГ" : "PASSWORD"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-teal transition-colors"
                placeholder={lang === "mn" ? "Нууц үг" : "Password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal hover:bg-teal-dark disabled:bg-slate-300 text-white py-3.5 rounded-lg text-[14px] font-medium transition-colors mb-4"
          >
            {loading ? (lang === "mn" ? "Нэвтрэж байна..." : "Signing in...") : (lang === "mn" ? "Нэвтрэх" : "Sign In")}
          </button>

          <div className="text-center">
            <Link
              href="/signup"
              className="text-[13px] text-teal hover:text-teal-dark transition-colors"
            >
              {lang === "mn" ? "Бүртгэлгүй юу? Бүртгүүлэх" : "Don't have an account? Sign up"}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}