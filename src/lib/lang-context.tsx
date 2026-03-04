"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { Lang } from "./data";

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "mn",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("mn");
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
