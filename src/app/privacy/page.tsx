import { metadataForPage } from "@/lib/site-metadata";
import PrivacyPageClient from "./PrivacyPageClient";

export const metadata = metadataForPage("/privacy");

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
