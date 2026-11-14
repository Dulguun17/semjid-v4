"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { analyticsFrameDocument, clearAnalyticsCookies, CONSENT_KEY, CONSENT_VERSION, marketingPath, parseConsent, validMeasurementId, type CookieConsent } from "@/lib/analytics-consent";

const ConsentContext = createContext({ openPreferences: () => {} });
export const useCookiePreferences = () => useContext(ConsentContext);

function MarketingAnalytics({ measurementId }: { measurementId?: string }) {
  const pathname = usePathname();
  const path = marketingPath(pathname);
  const id = validMeasurementId(measurementId);
  const frame = useRef<HTMLIFrameElement>(null);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const document = useMemo(() => id && origin ? analyticsFrameDocument(id, origin) : "", [id, origin]);
  useEffect(() => { if (path) frame.current?.contentWindow?.postMessage({ path }, "*"); }, [path]);
  if (!path || !document) return null;
  return <iframe ref={frame} data-analytics-frame title="Optional website analytics" hidden aria-hidden="true" tabIndex={-1}
    sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={document}
    onLoad={() => frame.current?.contentWindow?.postMessage({ path }, "*")} />;
}

async function stopAnalyticsFrames() {
  const frames = Array.from(document.querySelectorAll<HTMLIFrameElement>("[data-analytics-frame]"));
  await Promise.all(frames.map(frame => new Promise<void>(resolve => {
    const finished = () => { clearTimeout(timer); window.removeEventListener("message", acknowledge); resolve(); };
    const acknowledge = (event: MessageEvent) => {
      if (event.source === frame.contentWindow && event.data?.type === "semjid:analytics-stopped") finished();
    };
    const timer = setTimeout(finished, 500);
    window.addEventListener("message", acknowledge);
    frame.contentWindow?.postMessage({ type: "stop" }, "*");
  })));
}

function readStoredConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}
function subscribeConsent(notify: () => void) {
  const changed = (event: Event) => {
    if (event instanceof StorageEvent && event.key !== CONSENT_KEY && event.key !== null) return;
    if (event instanceof StorageEvent && !parseConsent(event.newValue)?.analytics) void stopAnalyticsFrames().then(notify);
    else notify();
  };
  window.addEventListener("storage", changed);
  window.addEventListener("semjid:consent", changed);
  return () => { window.removeEventListener("storage", changed); window.removeEventListener("semjid:consent", changed); };
}

export function CookieConsentProvider({ children, measurementId }: { children: React.ReactNode; measurementId?: string }) {
  const { lang } = useLang();
  const raw = useSyncExternalStore(subscribeConsent, readStoredConsent, () => undefined);
  const [memoryChoice, setMemoryChoice] = useState<CookieConsent | null>(null);
  const consent = memoryChoice ?? parseConsent(raw ?? null);
  const ready = raw !== undefined;
  const [optional, setOptional] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [storageFailed, setStorageFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const choiceVersion = useRef(0);
  useEffect(() => { if (ready && !consent?.analytics) clearAnalyticsCookies(); }, [ready, consent?.analytics]);
  const choose = async (analytics: boolean) => {
    const version = ++choiceVersion.current;
    if (!analytics) await stopAnalyticsFrames();
    if (version !== choiceVersion.current) return;
    const value: CookieConsent = { version: CONSENT_VERSION, analytics };
    setMemoryChoice(value);
    setGeneration(value => value + 1);
    if (!analytics) clearAnalyticsCookies();
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); setMemoryChoice(null); setStorageFailed(false); window.dispatchEvent(new Event("semjid:consent")); }
    catch { setStorageFailed(true); }
    dialog.current?.close();
  };
  const openPreferences = () => { setOptional(consent?.analytics ?? false); dialog.current?.showModal(); };
  const button = "min-h-11 rounded-lg border border-slate-500 bg-white px-4 py-2 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";
  return <ConsentContext.Provider value={{ openPreferences }}>
    {children}
    {ready && consent?.analytics && <MarketingAnalytics key={generation} measurementId={measurementId} />}
    {ready && !consent && <section aria-labelledby="cookie-banner-title" data-cookie-banner className="fixed inset-x-0 bottom-0 z-[60] max-h-[70dvh] overflow-y-auto border-t border-slate-300 bg-white p-4 shadow-xl sm:p-5">
      <div className="mx-auto max-w-6xl space-y-3">
        <h2 id="cookie-banner-title" className="text-lg font-semibold text-slate-900">{lang === "mn" ? "Күүки ба нууцлал" : "Cookies and privacy"}</h2>
        <p className="text-sm leading-6 text-slate-700">{lang === "mn" ? "Нэвтрэлт, захиалга, хүссэн чатын хадгалалт нь үндсэн үйлчилгээнд хэрэгтэй. Нэмэлт аналитик нь зөвшөөрсний дараа зөвхөн нийтийн хуудсуудын хандалтыг хэмжинэ. Сонголтоо хүссэн үедээ өөрчилж болно." : "Sign-in, booking and requested chat storage support essential services. Optional analytics measures visits to public pages only after you agree. You can change your choice at any time."} <Link href="/cookies" className="font-semibold text-teal underline">{lang === "mn" ? "Күүкийн бодлого" : "Cookie policy"}</Link></p>
        <div className="flex flex-wrap gap-3">
          <button className={button} onClick={() => choose(true)}>{lang === "mn" ? "Аналитик зөвшөөрөх" : "Accept analytics"}</button>
          <button className={button} onClick={() => choose(false)}>{lang === "mn" ? "Нэмэлтийг татгалзах" : "Reject optional"}</button>
          <button className={button} onClick={openPreferences}>{lang === "mn" ? "Тохиргоо" : "Preferences"}</button>
        </div>
      </div>
    </section>}
    {storageFailed && <p role="status" className="fixed bottom-4 left-4 z-[60] max-w-sm rounded-lg border bg-white p-3 text-sm">{lang === "mn" ? "Сонголт энэ хуудсанд үйлчилнэ. Хөтчийн хадгалалт хаалттай тул дараа дахин асууна." : "Your choice applies to this visit. Browser storage is blocked, so we will ask again next time."}</p>}
    <dialog ref={dialog} aria-labelledby="cookie-preferences-title" className="m-auto max-h-[85dvh] w-11/12 max-w-lg overflow-y-auto rounded-2xl p-6 text-slate-900 backdrop:bg-black/50">
      <h2 id="cookie-preferences-title" className="text-xl font-semibold">{lang === "mn" ? "Күүкийн тохиргоо" : "Cookie preferences"}</h2>
      <p className="mt-4 text-sm leading-6">{lang === "mn" ? "Үндсэн хадгалалт нэвтрэлт, захиалга, чатыг ажиллуулна. Аналитикаас татгалзах нь эдгээрийг хаахгүй." : "Essential storage supports sign-in, booking and chat. Rejecting analytics keeps these services available."}</p>
      <label className="my-5 flex min-h-11 items-center gap-3 font-semibold"><input type="checkbox" checked={optional} onChange={event => setOptional(event.target.checked)} className="h-5 w-5" />{lang === "mn" ? "Нэмэлт аналитик" : "Optional analytics"}</label>
      <p className="mb-5 text-sm leading-6">{lang === "mn" ? "Аналитикийг унтрааж хадгалбал цаашдын цуглуулга зогсож, энэ сайтаас устгаж болох GA күүки устна. Өмнө илгээсэн мэдээлэл буцаагдахгүй." : "Save with analytics off to stop future collection and remove accessible GA cookies for this site. This does not erase data already sent."}</p>
      <div className="flex flex-wrap gap-3">
        <button className={button} onClick={() => choose(optional)}>{lang === "mn" ? "Сонголт хадгалах" : "Save preferences"}</button>
        <button className={button} onClick={() => choose(false)}>{lang === "mn" ? "Нэмэлтийг татгалзах" : "Reject optional"}</button>
        <button className={button} onClick={() => dialog.current?.close()}>{lang === "mn" ? "Хаах" : "Close"}</button>
      </div>
    </dialog>
  </ConsentContext.Provider>;
}
