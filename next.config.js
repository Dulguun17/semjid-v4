let publicOrigin = false;
try {
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
  publicOrigin = url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash && url.pathname === "/" && url.hostname !== "localhost" && !url.hostname.endsWith(".local") && !/^\d+(?:\.\d+){3}$/.test(url.hostname) && !url.hostname.includes(":");
} catch { /* Unconfigured hosts default to no indexing. */ }
const indexable = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production" && publicOrigin;
const privateRoutes = ["/admin/:path*", "/api/:path*", "/booking/:path*", "/profile/:path*", "/login", "/signup", "/auth/:path*", "/rooms/availability/:path*"];
const production = process.env.NODE_ENV === "production";
const policy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com" + (production ? "" : " ws://localhost:* ws://127.0.0.1:*"),
  "frame-src 'self' about:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: [] },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: [
      ...(!indexable ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] : []),
      { key: "Content-Security-Policy", value: policy },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
      ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
    ] }, ...privateRoutes.map(source => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }))];
  },
};
module.exports = nextConfig;
