import { metadataForPage } from "@/lib/site-metadata";
import TermsPageClient from "./TermsPageClient";

export const metadata = metadataForPage("/terms");

export default function TermsPage() {
  return <TermsPageClient />;
}
