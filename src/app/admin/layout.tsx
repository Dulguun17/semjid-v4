"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  BarChart3,
  BedDouble,
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Star,
  Users,
  X,
} from "lucide-react";

type WorkspaceRole = "customer" | "staff" | "ceo";

const staffNavigation = [
  { href: "/admin", icon: LayoutDashboard, label: "Ажилтны самбар" },
  { href: "/admin/bookings/manage", icon: BookOpen, label: "Захиалгууд" },
  { href: "/admin/calendar", icon: Calendar, label: "Захиалгын календар" },
  { href: "/admin/rooms", icon: BedDouble, label: "Өрөөний хүртээмж" },
  { href: "/admin/guests", icon: Users, label: "Үйлчлүүлэгчид" },
  { href: "/admin/chat", icon: MessageSquare, label: "Мессежүүд" },
  { href: "/admin/payments", icon: CreditCard, label: "Захиалгын төлбөр" },
  { href: "/admin/reviews", icon: Star, label: "Санал үнэлгээ" },
];

const managerNavigation = [
  { href: "/admin/content", icon: FileText, label: "Контент удирдах" },
  { href: "/admin/rooms-management", icon: BedDouble, label: "Өрөөний үнэ" },
  { href: "/admin/settings", icon: Settings, label: "Тохиргоо" },
];

const ceoNavigation = [
  { href: "/admin/ceo", icon: BarChart3, label: "Бизнесийн тойм" },
];

const managerOnlyPaths = [
  "/admin/content",
  "/admin/rooms-management",
  "/admin/settings",
];

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Хандах эрхгүй</h1>
      <p className="mt-3 text-sm text-slate-600">{message}</p>
      <Link href="/admin/login" className="mt-6 inline-flex rounded-lg bg-teal px-4 py-2 text-sm text-white">
        Админ нэвтрэх
      </Link>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<WorkspaceRole | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    let active = true;

    const checkWorkspaceAccess = async () => {
      if (pathname === "/admin/login") {
        setChecking(false);
        return;
      }

      setChecking(true);
      setAccessError("");

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!active) return;
        if (userError || !userData.user) {
          setRole(null);
          setChecking(false);
          return;
        }

        const [{ data: roleValue, error: roleError }, { data: managerValue, error: managerError }] =
          await Promise.all([
            supabase.rpc("get_workspace_role"),
            supabase.rpc("is_workspace_manager"),
          ]);
        if (!active) return;

        if (roleError || managerError) {
          console.error("Workspace access check failed", roleError || managerError);
          setAccessError("Ажлын орчны эрхийг баталгаажуулж чадсангүй. Өгөгдлийн сангийн миграцыг шалгана уу.");
          setChecking(false);
          return;
        }

        if (roleValue !== "customer" && roleValue !== "staff" && roleValue !== "ceo") {
          setAccessError("Танай бүртгэлд хүчинтэй ажлын орчны эрх олдсонгүй.");
          setChecking(false);
          return;
        }

        setRole(roleValue);
        setIsManager(managerValue === true);
        if (roleValue === "ceo" && pathname === "/admin") {
          router.replace("/admin/ceo");
          return;
        }
        setChecking(false);
      } catch (error) {
        if (!active) return;
        console.error("Workspace access check failed", error);
        setAccessError("Ажлын орчны эрхийг баталгаажуулж чадсангүй. Сүлжээ болон өгөгдлийн сангийн тохиргоог шалгана уу.");
        setChecking(false);
      }
    };

    void checkWorkspaceAccess();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Sign out failed", error);
    router.replace("/admin/login");
  };

  if (pathname === "/admin/login") return <>{children}</>;

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

  if (accessError) {
    return <AccessDenied message={accessError} />;
  }

  if (!role) {
    return <AccessDenied message="Ажлын орчинд нэвтрэхийн тулд эрх бүхий бүртгэлээр нэвтэрнэ үү." />;
  }

  if (role === "customer") {
    return <AccessDenied message="Хэрэглэгчийн бүртгэлээр ажилтны болон CEO ажлын орчинд нэвтрэх боломжгүй." />;
  }

  const isCeoRoute = pathname === "/admin/ceo" || pathname === "/admin/analytics";
  const isManagerRoute = managerOnlyPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
  const denied =
    (role === "ceo" && !isCeoRoute) ||
    (role === "staff" && isCeoRoute) ||
    (role === "staff" && isManagerRoute && !isManager);

  if (denied) {
    const message = role === "ceo"
      ? "CEO ажлын орчин зөвхөн унших бизнесийн тоймыг агуулна. Ажилтны үйлдэл энэ бүртгэлд нээлттэй биш."
      : isManagerRoute
        ? "Тохиргоо, контент болон өрөөний үнийг зөвхөн тусгайлан эрх олгосон менежер өөрчилнө."
        : "Энэ хуудас CEO-ийн унших эрхтэй ажлын орчинд хамаарна.";
    return <AccessDenied message={message} />;
  }

  const navigation = role === "ceo"
    ? ceoNavigation
    : isManager
      ? [...staffNavigation, ...managerNavigation]
      : staffNavigation;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0`}>
        <div className="flex items-center gap-3 border-b border-slate-800 p-6">
          <div className="relative h-9 w-9 shrink-0">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div>
            <div className="text-[13px] font-semibold leading-tight text-white">Сэмжид Хүжирт</div>
            <div className="text-[10px] text-slate-400">{role === "ceo" ? "CEO Workspace" : "Staff Workspace"}</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto cursor-pointer text-slate-400 hover:text-white lg:hidden" aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] no-underline transition-all ${active ? "bg-teal font-medium text-white shadow-lg shadow-teal/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button onClick={logout} className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[13px] text-slate-400 transition-all hover:bg-slate-800 hover:text-white">
            <LogOut size={17} /> Гарах
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <button onClick={() => setSidebarOpen(true)} className="cursor-pointer text-slate-500 lg:hidden" aria-label="Open navigation">
            <Menu size={22} />
          </button>
          <div className="ml-auto text-xs font-medium uppercase tracking-wide text-slate-500">
            {role === "ceo" ? "Зөвхөн унших" : isManager ? "Ажилтан · Менежер" : "Ажилтан"}
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
