"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useLang } from "@/lib/lang-context";
import { applyTheme, chooseTheme, readTheme, subscribeTheme, type ThemePreference } from "@/lib/theme";
export function ThemeToggle() {
  const { lang } = useLang();
  const preference = useSyncExternalStore(subscribeTheme, readTheme, () => "system" as ThemePreference);
  useEffect(() => { applyTheme(readTheme()); }, []);
  return <label className="inline-flex min-h-11 items-center gap-2 text-xs text-slate-600"><span className="sr-only">{lang === "mn" ? "Өнгөний горим" : "Colour theme"}</span><select data-theme-toggle aria-label={lang === "mn" ? "Өнгөний горим" : "Colour theme"} value={preference} onChange={event => chooseTheme(event.target.value as ThemePreference)} className="min-h-11 max-w-32 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700"><option value="system">{lang === "mn" ? "Систем" : "System"}</option><option value="light">{lang === "mn" ? "Гэрэлтэй" : "Light"}</option><option value="dark">{lang === "mn" ? "Бараан" : "Dark"}</option></select></label>;
}
