import { metadataForPage } from "@/lib/site-metadata";
import { BookingFAQ } from "@/components/ui/BookingFAQ";

export const metadata = metadataForPage("/faq");

export default function FAQPage() {
  return <main className="mx-auto min-h-[70vh] max-w-4xl px-4 py-12 sm:px-6"><BookingFAQ /></main>;
}
