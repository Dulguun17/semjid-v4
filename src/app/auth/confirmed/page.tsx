"use client";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { useLang } from "@/lib/lang-context";

export default function AuthConfirmedPage() {
  const { lang } = useLang();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="bg-white rounded-2xl p-10 shadow-sm">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-teal" />
          </div>
          <h1 className="font-serif text-2xl text-slate-800 mb-3">
            {lang === "mn" ? "И-мэйл баталгаажлаа!" : "Email Confirmed!"}
          </h1>
          <p className="text-[14px] text-slate-500 mb-8">
            {lang === "mn"
              ? "Таны бүртгэл амжилттай баталгаажлаа. Одоо нэвтрэх боломжтой."
              : "Your account has been successfully confirmed. You can now sign in."}
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-teal hover:bg-teal-dark text-white py-3.5 rounded-lg text-[14px] font-medium transition-colors no-underline"
          >
            {lang === "mn" ? "Нэвтрэх" : "Sign In"}
          </Link>
        </div>
      </div>
    </div>
  );
}
