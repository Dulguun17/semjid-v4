"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { completeAuthCallback } from "@/lib/auth-callback";
import { useLang } from "@/lib/lang-context";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { lang } = useLang();
  const operation = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    let active = true;
    if (!operation.current) {
      const url = new URL(window.location.href);
      window.history.replaceState(window.history.state, "", url.pathname);
      operation.current = completeAuthCallback(supabase.auth, url);
    }
    void operation.current.then(confirmed => {
      if (active) {
        router.replace(confirmed ? "/auth/confirmed" : "/auth/error");
        router.refresh();
      }
    });
    return () => { active = false; };
  }, [router]);

  return <main className="flex min-h-[60vh] items-center justify-center px-4" aria-busy="true">
    <p role="status">{lang === "mn" ? "И-мэйл баталгаажуулж байна…" : "Verifying your email…"}</p>
  </main>;
}
