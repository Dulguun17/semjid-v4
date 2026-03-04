"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import type { Lang } from "@/lib/data";

interface LangCtx { lang: Lang; setLang: (l: Lang) => void; }
const Ctx = createContext<LangCtx>({ lang: "mn", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("mn");
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
