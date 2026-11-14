import { metadataForPage } from "@/lib/site-metadata";
import RefundPolicyPageClient from "./RefundPolicyPageClient";

export const metadata = metadataForPage("/refund-policy");

export default function RefundPolicyPage() {
  return <RefundPolicyPageClient />;
}
