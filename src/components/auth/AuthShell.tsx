"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MessageSquare, UserRound } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { authCopy } from "./auth-copy";
import styles from "./CustomerAuth.module.css";

export function AuthShell({ children }: { children: ReactNode }) {
  const { lang } = useLang();
  const copy = authCopy[lang];
  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <div className={styles.topline}>
          <Link href="/"><ArrowLeft size={16} aria-hidden="true" />{copy.back}</Link>
          <span>{copy.account}</span>
        </div>
        <div className={styles.card}>
          <aside className={styles.story}>
            <Image src="/images/landscape.jpeg" alt="" fill sizes="(min-width: 900px) 480px, 1px" className={styles.photo} />
            <div className={styles.photoShade} />
            <div className={styles.storyContent}>
              <div className={styles.brand}>
                <Image src="/images/logo.png" alt="" width={64} height={64} />
                <div><strong>{copy.brand}</strong><span>{copy.brandNote}</span></div>
              </div>
              <div className={styles.storyWords}>
                <span className={styles.goldLine} />
                <h2>{copy.retreatTitle}</h2>
                <p>{copy.retreatBody}</p>
              </div>
              <ul className={styles.benefits}>
                <li><CalendarDays size={18} aria-hidden="true" />{copy.linkedStays}</li>
                <li><MessageSquare size={18} aria-hidden="true" />{copy.feedback}</li>
                <li><UserRound size={18} aria-hidden="true" />{copy.profile}</li>
              </ul>
            </div>
          </aside>
          <section className={styles.formSide}>
            <div className={styles.mobileBrand}>
              <Image src="/images/logo.png" alt="" width={48} height={48} />
              <span>{copy.brand}</span>
            </div>
            {children}
            <nav className={styles.policies} aria-label={copy.policies}>
              <Link href="/privacy">{copy.privacy}</Link><span aria-hidden="true">·</span><Link href="/terms">{copy.terms}</Link>
            </nav>
          </section>
        </div>
      </div>
    </main>
  );
}
