import { NextResponse } from "next/server";
import { canonicalSiteOrigin, publicIndexingEnabled } from "@/lib/site-metadata";
export async function GET() {
  const body = publicIndexingEnabled()
    ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${canonicalSiteOrigin()}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n";
  return new NextResponse(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
