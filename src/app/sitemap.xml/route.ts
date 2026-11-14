import { NextResponse } from "next/server";
import { PAGE_DETAILS, canonicalSiteOrigin, publicIndexingEnabled } from "@/lib/site-metadata";
export async function GET() {
  const origin = canonicalSiteOrigin();
  const locations = publicIndexingEnabled() && origin ? Object.keys(PAGE_DETAILS).map(path => `<url><loc>${origin}${path === "/" ? "" : path}</loc></url>`).join("\n") : "";
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
