export const CONSENT_KEY = "semjid:cookie-consent";
export const CONSENT_VERSION = 1;
export type CookieConsent = { version: 1; analytics: boolean };

export function parseConsent(raw: string | null): CookieConsent | null {
  try {
    const value = raw ? JSON.parse(raw) : null;
    return value?.version === CONSENT_VERSION && typeof value.analytics === "boolean"
      ? { version: CONSENT_VERSION, analytics: value.analytics } : null;
  } catch { return null; }
}

export const MARKETING_PAGES: Record<string, string> = {
  "/": "Semjid Khujirt",
  "/about": "About Semjid",
  "/rooms": "Room types",
  "/services": "Services",
  "/faq": "Booking questions",
};

export function marketingPath(path: string): string | null {
  return Object.hasOwn(MARKETING_PAGES, path) ? path : null;
}

export function validMeasurementId(value: string | undefined): string | null {
  return value && /^G-[A-Z0-9]{6,15}$/.test(value) ? value : null;
}

export function clearAnalyticsCookies() {
  let cookies: string;
  try { cookies = document.cookie; } catch { return; }
  const names = cookies.split(";").map(value => value.split("=")[0].trim())
    .filter(name => /^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name));
  const parts = location.hostname.split(".");
  const domains = ["", ...parts.slice(0, -1).map((_, i) => parts.slice(i).join("."))];
  const paths = new Set(["/", "/booking", "/profile", "/admin"]);
  const segments = location.pathname.split("/");
  for (let i = 1; i <= segments.length; i++) paths.add(segments.slice(0, i).join("/") || "/");
  for (const name of names) for (const domain of domains) for (const path of paths) {
    try { document.cookie = `${name}=; Max-Age=0; Path=${path}; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`; } catch { /* Only browser-accessible cookies can be removed. */ }
  }
}

// An opaque sandbox origin prevents the vendor tag from reading the host page,
// its URL, forms, auth storage or cookies, including during SPA navigation.
export function analyticsFrameDocument(measurementId: string, origin: string): string {
  if (!validMeasurementId(measurementId) || new URL(origin).origin !== origin) throw new Error("Invalid analytics configuration");
  const config = JSON.stringify({ measurementId, origin, pages: MARKETING_PAGES }).replaceAll("<", "\\u003c");
  return `<!doctype html><html><head><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://www.googletagmanager.com; connect-src https://www.google-analytics.com https://region1.google-analytics.com; img-src https://www.google-analytics.com https://region1.google-analytics.com; base-uri 'none'; form-action 'none'"><title>Semjid website analytics</title></head><body><script>
  const settings = ${config};
  let started = false;
  let stopped = false;
  let lastPath = null;
  window.dataLayer = [];
  function gtag() { dataLayer.push(arguments); }
  window.addEventListener('message', function(event) {
    if (event.source !== parent || event.origin !== settings.origin) return;
    if (event.data && event.data.type === 'stop') {
      stopped = true;
      window['ga-disable-' + settings.measurementId] = true;
      window.dataLayer.length = 0;
      document.querySelector('script[src]')?.remove();
      parent.postMessage({type:'semjid:analytics-stopped'}, settings.origin);
      return;
    }
    if (stopped) return;
    const path = event.data && event.data.path;
    if (!Object.prototype.hasOwnProperty.call(settings.pages, path) || path === lastPath) return;
    lastPath = path;
    const fields = {page_location: settings.origin + path, page_referrer: '', page_title: settings.pages[path]};
    if (!started) {
      started = true;
      gtag('consent', 'default', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
      gtag('js', new Date());
      gtag('config', settings.measurementId, {...fields, send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false, client_id:crypto.randomUUID(), cookie_expires:0});
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + settings.measurementId;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      document.head.appendChild(script);
    }
    gtag('set', fields);
    gtag('event', 'page_view', {...fields, send_to:settings.measurementId});
  });
  </script></body></html>`;
}
