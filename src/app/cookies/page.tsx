import { metadataForPage } from "@/lib/site-metadata";
import { CookiePolicy } from "@/components/privacy/CookiePolicy";
export const metadata = metadataForPage("/cookies");
export default function CookiesPage() { return <CookiePolicy />; }
