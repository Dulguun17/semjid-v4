"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-24">
      <div className="max-w-2xl text-center">
        <div className="text-[10px] uppercase tracking-[0.4em] text-red-500 font-semibold mb-5">500 — Server Error</div>
        <h1 className="text-4xl font-serif text-slate-900 mb-4">Ямар нэг алдаа гарсан байна.</h1>
        <p className="text-slate-500 mb-8">Сайт руу дахин хандаж үзнэ үү эсвэл буцах товчлуур дээр дарна уу.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="inline-flex items-center justify-center bg-teal text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-teal-dark">
            Нүүр хуудас
          </Link>
          <button onClick={reset} className="inline-flex items-center justify-center border border-slate-200 text-slate-700 px-6 py-3 rounded-xl text-sm font-medium hover:bg-slate-100">
            Дахин ачаалах
          </button>
        </div>
      </div>
    </main>
  );
}
