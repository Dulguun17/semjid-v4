"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TrendingUp, FileText, Settings } from "lucide-react";
import {
  LayoutDashboard, Calendar, Users, BedDouble,
  MessageSquare, LogOut, Menu, X, Bell
} from "lucide-react";
import Image from "next/image";

const navItems = [
  { href: "/admin/analytics", icon: TrendingUp, label: "Аналитик" },
  { href: "/admin",         icon: LayoutDashboard, label: "Хяналтын самбар" },
  { href: "/admin/calendar", icon: Calendar,        label: "Захиалгын календар" },
  { href: "/admin/guests",   icon: Users,           label: "Зочид" },
  { href: "/admin/rooms-management", icon: BedDouble, label: "Өрөөний удирдалга" },
  { href: "/admin/content",  icon: FileText,        label: "Контент удирдах" },
  { href: "/admin/settings", icon: Settings,        label: "Тохиргоо" },
  { href: "/admin/chat",     icon: MessageSquare,   label: "Чат" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && pathname !== "/admin/login") {
        router.push("/admin/login");
      }
      setChecking(false);
    };
    check();
  }, [router, pathname]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") return <>{children}</>;
  if (checking) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="relative w-9 h-9 shrink-0">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain"/>
          </div>
          <div>
            <div className="text-white text-[13px] font-semibold leading-tight">Сэмжид Хүжирт</div>
            <div className="text-[10px] text-slate-500">Admin Panel</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-500 hover:text-white cursor-pointer">
            <X size={18}/>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] transition-all no-underline
                  ${active ? "bg-teal text-white font-medium shadow-lg shadow-teal/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                <Icon size={17}/>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[13px] text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer">
            <LogOut size={17}/> Гарах
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}/>}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 cursor-pointer">
            <Menu size={22}/>
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <Bell size={17} className="text-slate-500"/>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal rounded-full"/>
            </button>
            <div className="w-9 h-9 bg-teal rounded-lg flex items-center justify-center">
              <span className="text-white text-[12px] font-bold">А</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
