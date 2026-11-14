import type { Metadata } from "next";

export const PAGE_DETAILS = {
  "/": { title: "Сэмжид Хужирт | Semjid Khujirt", description: "Сэмжид Хужирт рашаан сувилал. Explore rooms, services, arrival information and booking guidance in Khujirt, Uvurkhangai." },
  "/about": { title: "About | Сэмжид Хужирт", description: "Learn about Semjid Khujirt, its mineral-spring setting and services, and find practical information for planning a stay." },
  "/rooms": { title: "Rooms and rates | Сэмжид Хужирт", description: "Compare Semjid room photos, facilities and published rates. Choose dates to review availability and confirm package inclusions with reception." },
  "/services": { title: "Services | Сэмжид Хужирт", description: "Explore the services described by Semjid Khujirt. Suitable treatments depend on consultation. Confirm prices and package inclusions with reception." },
  "/contact": { title: "Contact and directions | Сэмжид Хужирт", description: "Contact Semjid Khujirt reception by phone or Messenger for stay information, current transfer instructions and travel arrangements." },
  "/faq": { title: "Booking questions | Сэмжид Хужирт", description: "Find answers about shared rooms, staff-verified bank transfers, arrival preparation and booking terms at Semjid Khujirt." },
  "/privacy": { title: "Privacy | Сэмжид Хужирт", description: "How Semjid uses account, booking, chat and feedback information, with optional analytics choices and privacy contact information." },
  "/cookies": { title: "Cookie choices | Сэмжид Хужирт", description: "Review essential browser storage, optional analytics and how to accept, reject or withdraw analytics consent on the Semjid website." },
  "/terms": { title: "Booking terms | Сэмжид Хужирт", description: "Review Semjid booking guidance and confirm payment, service, change and cancellation arrangements with reception before booking." },
  "/refund-policy": { title: "Cancellation and refunds | Сэмжид Хужирт", description: "Contact reception to confirm Semjid booking changes, cancellation and applicable refund arrangements before confirming a stay." },
} as const;

export function canonicalSiteOrigin(value = process.env.NEXT_PUBLIC_SITE_URL): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/"
      || url.hostname === "localhost" || url.hostname.endsWith(".local") || /^\d+(?:\.\d+){3}$/.test(url.hostname) || url.hostname.includes(":")) return null;
    return url.origin;
  } catch { return null; }
}

export function publicIndexingEnabled(env = process.env): boolean {
  return env.NODE_ENV === "production" && env.VERCEL_ENV === "production" && !!canonicalSiteOrigin(env.NEXT_PUBLIC_SITE_URL);
}

export const PRIVATE_PAGE_METADATA: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export function metadataForPage(path: keyof typeof PAGE_DETAILS): Metadata {
  const page = PAGE_DETAILS[path];
  const origin = canonicalSiteOrigin();
  return {
    ...page,
    ...(origin ? { alternates: { canonical: `${origin}${path === "/" ? "" : path}` } } : {}),
    openGraph: { type: "website", siteName: "Semjid Khujirt", ...page, ...(origin ? { url: `${origin}${path}` } : {}), images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Semjid Khujirt — rooms, services and arrival information" }] },
    twitter: { card: "summary_large_image", ...page, images: ["/opengraph-image"] },
  };
}
