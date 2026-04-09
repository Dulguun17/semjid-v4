"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/lang-context";
import { Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/profile";
  const { lang } = useLang();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
      setError(lang === "mn" ? "Нууц үг таарахгүй байна." : "Passwords do not match.");
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError(lang === "mn" ? "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой." : "Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const hasLetters = /[a-zA-Z]/.test(form.password);
    const hasNumbers = /[0-9]/.test(form.password);

    if (!hasLetters || !hasNumbers) {
      setError(lang === "mn" ? "Нууц үг үсэг болон цифр агуулсан байх ёстой." : "Password must contain both letters and numbers.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.error || (lang === "mn" ? "Бүртгэл амжилтгүй боллоо." : "Registration failed."));
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(lang === "mn" ? "Бүртгэл амжилтгүй боллоо." : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="font-serif text-2xl text-slate-800 mb-3">
              {lang === "mn" ? "Бүртгэл амжилттай!" : "Registration Successful!"}
            </h2>
            <p className="text-[14px] text-slate-500 mb-6">
              {lang === "mn"
                ? "И-мэйл хаягаа шалгаж бүртгэлийг баталгаажуулна уу."
                : "Please check your email to confirm your registration."
              }
            </p>
            <Link
              href={`/login${redirectTo !== "/profile" ? `?redirect=${redirectTo}` : ""}`}
              className="inline-flex items-center gap-2 text-[13px] text-teal hover:text-teal-dark transition-colors"
            >
              {lang === "mn" ? "Нэвтрэх" : "Sign In"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
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
            {lang === "mn" ? "Бүртгүүлэх" : "Sign Up"}
          </h1>
          <p className="text-[13px] text-slate-400 mt-1">
            {lang === "mn" ? "Сэмжид Хүжирт Рашаан Сувилал" : "Semjid Khujirt Resort"}
          </p>
        </div>

        <form onSubmit={handleSignup} className="bg-white rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5">
                {lang === "mn" ? "НЭР" : "FIRST NAME"}
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-teal transition-colors"
                placeholder={lang === "mn" ? "Нэр" : "First name"}
                required
              />
            </div>
            <div>
              <label className="text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5">
                {lang === "mn" ? "ОВОГ" : "LAST NAME"}
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-teal transition-colors"
                placeholder={lang === "mn" ? "Овог" : "Last name"}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5">
              {lang === "mn" ? "УТАСНЫ ДУГААР" : "PHONE"}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-teal transition-colors"
              placeholder={lang === "mn" ? "Утасны дугаар" : "Phone number"}
            />
          </div>

          <div className="mb-4">
            <label className="text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5">
              {lang === "mn" ? "И-МЭЙЛ" : "EMAIL"}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-teal transition-colors"
              placeholder={lang === "mn" ? "И-мэйл хаяг" : "Email address"}
              required
            />
          </div>

          <div className="mb-4">
            <label className="text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5">
              {lang === "mn" ? "НУУЦ ҮГ" : "PASSWORD"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-teal transition-colors"
                placeholder={lang === "mn" ? "Нууц үг" : "Password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[11px] tracking-[0.12em] uppercase text-slate-400 block mb-1.5">
              {lang === "mn" ? "НУУЦ ҮГ БАТЛАХ" : "CONFIRM PASSWORD"}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-teal transition-colors"
                placeholder={lang === "mn" ? "Нууц үг давтах" : "Confirm password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal hover:bg-teal-dark disabled:bg-slate-300 text-white py-3 rounded-lg text-[14px] font-medium transition-colors mb-4"
          >
            {loading ? (lang === "mn" ? "Бүртгэж байна..." : "Signing up...") : (lang === "mn" ? "Бүртгүүлэх" : "Sign Up")}
          </button>

          <div className="text-center">
            <Link
              href={`/login${redirectTo !== "/profile" ? `?redirect=${redirectTo}` : ""}`}
              className="text-[13px] text-teal hover:text-teal-dark transition-colors"
            >
              {lang === "mn" ? "Бүртгэлтэй юу? Нэвтрэх" : "Already have an account? Sign in"}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" /></div>}>
      <SignupContent />
    </Suspense>
  );
}