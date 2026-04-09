import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-24">
      <div className="max-w-2xl text-center">
        <div className="text-[10px] uppercase tracking-[0.4em] text-teal font-semibold mb-5">404 — Page Not Found</div>
        <h1 className="text-4xl font-serif text-slate-900 mb-4">Уучлаарай, энэ хуудас олдсонгүй.</h1>
        <p className="text-slate-500 mb-8">Таны хайж буй хуудас байхгүй эсвэл хаяг буруу татагдсан байна.</p>
        <Link href="/" className="inline-flex items-center justify-center bg-teal text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-teal-dark">
          Нүүр хуудас руу буцах
        </Link>
      </div>
    </main>
  );
}
