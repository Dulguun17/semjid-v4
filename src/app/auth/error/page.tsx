"use client";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { useLang } from "@/lib/lang-context";

export default function AuthErrorPage() {
  const { lang } = useLang();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="bg-white rounded-2xl p-10 shadow-sm">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h1 className="font-serif text-2xl text-slate-800 mb-3">
            {lang === "mn" ? "Алдаа гарлаа" : "Something went wrong"}
          </h1>
          <p className="text-[13px] text-slate-400 mb-2">
            {lang === "mn"
                  ? "Баталгаажуулах холбоос хүчингүй эсвэл хугацаа дууссан байна."
                  : "The confirmation link is invalid or has expired."}
          </p>
          <p className="text-[13px] text-slate-400 mb-8">
            {lang === "mn"
              ? "Дахин бүртгүүлж шинэ холбоос авна уу."
              : "Please sign up again to receive a new link."}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="inline-block w-full bg-teal hover:bg-teal-dark text-white py-3.5 rounded-lg text-[14px] font-medium transition-colors no-underline"
            >
              {lang === "mn" ? "Дахин бүртгүүлэх" : "Sign Up Again"}
            </Link>
            <Link
              href="/login"
              className="inline-block w-full text-teal text-[14px] transition-colors no-underline"
            >
              {lang === "mn" ? "Нэвтрэх" : "Sign In"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
